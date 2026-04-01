/**
 * Journal Retention and Compaction
 * 
 * Implements lawbook 052 (Task 024).
 * Replay-preserving compaction for runtime journal.
 */

import type { Journal, JournalRecord, IntegrationRecord } from "../types/journal.js";
import type {
  JournalSnapshot,
  CompactedJournal,
  EffectiveOperatorState,
  CompactionVerdict,
} from "../types/journal-compaction.js";
import type { OperatorActionRecord } from "../types/journal.js";
import type { CompensationActionRecord } from "../types/operator-compensation.js";

/**
 * Compute effective operator state from journal records.
 * 
 * Reconstructs the cumulative effect of operator actions.
 */
export function computeEffectiveOperatorState(
  records: Array<OperatorActionRecord | CompensationActionRecord>
): EffectiveOperatorState {
  const state: EffectiveOperatorState = {
    acknowledgedConflicts: {},
    activeRebindRequests: {},
    notes: [],
    compensatedSeqs: [],
  };

  for (const record of records) {
    if (record.tag === "OperatorAction") {
      const action = record.action;
      const verdict = record.verdict;

      // Only process admissible actions
      if (verdict.tag === "Inadmissible") continue;

      switch (action.tag) {
        case "AcknowledgeConflict": {
          const ws = action.workspaceId;
          if (!state.acknowledgedConflicts[ws]) {
            state.acknowledgedConflicts[ws] = [];
          }
          if (!state.acknowledgedConflicts[ws].includes(action.conflictTag)) {
            state.acknowledgedConflicts[ws].push(action.conflictTag);
          }
          break;
        }
        case "RequestRebind": {
          state.activeRebindRequests[action.roleId] = action.targetProfile;
          break;
        }
        case "RecordNote": {
          state.notes.push({
            scope: action.scope,
            targetId: action.targetId,
            note: action.note,
            seq: record.seq,
          });
          break;
        }
      }
    } else if (record.tag === "CompensationAction") {
      // Process compensation
      if (record.verdict.tag === "Compensable") {
        state.compensatedSeqs.push(record.action.compensatesSeq);

        // Apply compensation effects
        const action = record.action;
        switch (action.tag) {
          case "WithdrawConflictAcknowledgment": {
            const ws = action.workspaceId;
            const conflicts = state.acknowledgedConflicts[ws] || [];
            state.acknowledgedConflicts[ws] = conflicts.filter(
              c => c !== action.conflictTag
            );
            break;
          }
          case "CancelRebindRequest": {
            delete state.activeRebindRequests[action.roleId];
            break;
          }
          case "RetractNote": {
            state.notes = state.notes.filter(n => n.seq !== action.compensatesSeq);
            break;
          }
        }
      }
    }
  }

  return state;
}

/**
 * Create a snapshot from journal records up to a given sequence point.
 * 
 * Law R2: Snapshot encodes replay-relevant state.
 */
export function createSnapshot(
  records: JournalRecord[],
  upToSeq: number
): JournalSnapshot {
  const workspaceHashes: Record<string, string> = {};
  const integrationVerdicts: Record<string, IntegrationVerdict> = {};

  // Process integration records
  for (const record of records) {
    if (record.seq > upToSeq) break;

    if (record.tag === "IntegrationEvaluated") {
      workspaceHashes[record.workspaceHash] = record.workspaceHash;
      integrationVerdicts[record.workspaceHash] = record.verdict;
    }
  }

  // Get operator records for effective state
  const operatorRecords = records.filter(
    (r): r is OperatorActionRecord | CompensationActionRecord =>
      r.tag === "OperatorAction" || r.tag === "CompensationAction"
  );

  const effectiveOperatorState = computeEffectiveOperatorState(
    operatorRecords.filter(r => r.seq <= upToSeq)
  );

  return {
    tag: "JournalSnapshot",
    seq: upToSeq,
    workspaceHashes,
    integrationVerdicts,
    effectiveOperatorState,
  };
}

/**
 * Compact journal at a given sequence point.
 * 
 * Law R1: Only prefix may be compacted.
 * Law R2: Snapshot + tail must be replay-equivalent.
 */
export function compactJournal(
  journal: Journal,
  atSeq: number
): CompactionVerdict {
  // Validate compaction point
  if (atSeq < 1) {
    return { tag: "CompactionFailed", reason: "Compaction point must be >= 1" };
  }

  if (atSeq >= journal.nextSeq - 1) {
    return { tag: "CompactionFailed", reason: "Cannot compact entire journal" };
  }

  // Find records to compact (prefix) and tail
  const prefix: JournalRecord[] = [];
  const tail: Array<OperatorActionRecord | CompensationActionRecord> = [];

  for (const record of journal.records) {
    if (record.seq <= atSeq) {
      prefix.push(record);
    } else {
      // Tail only includes operator/compensation records (not integration)
      if (record.tag === "OperatorAction" || record.tag === "CompensationAction") {
        tail.push(record);
      }
    }
  }

  // Create snapshot from prefix
  const snapshot = createSnapshot(prefix, atSeq);

  const compacted: CompactedJournal = {
    tag: "CompactedJournal",
    snapshot,
    tail,
    nextSeq: journal.nextSeq,
  };

  return { tag: "Compacted", compacted };
}

/**
 * Expand compacted journal back to full journal for replay.
 * 
 * This is the inverse operation that allows replay of compacted journals.
 */
export function expandCompacted(
  compacted: CompactedJournal,
  workspaceResolver: (hash: string) => unknown
): Journal {
  // For replay, we create a synthetic journal where:
  // - The snapshot is represented as a single synthetic record
  // - The tail follows
  // 
  // Note: Full expansion requires integration records which may not be present
  // This function creates a minimal journal suitable for operator state reconstruction

  const records: JournalRecord[] = [];

  // Add integration records from snapshot (reconstructed)
  for (const [hash, verdict] of Object.entries(compacted.snapshot.integrationVerdicts)) {
    records.push({
      tag: "IntegrationEvaluated",
      seq: compacted.snapshot.seq, // Use snapshot seq
      at: compacted.snapshot.seq,
      workspaceHash: hash,
      facts: [], // Facts not preserved in snapshot
      verdict,
    });
  }

  // Add tail records
  records.push(...compacted.tail);

  return {
    records,
    nextSeq: compacted.nextSeq,
  };
}

/**
 * Verify that compacted journal is replay-equivalent to original.
 * 
 * Law R2: Replay equivalence check.
 */
export function verifyCompactionEquivalence(
  original: Journal,
  compacted: CompactedJournal
): boolean {
  // Check effective operator state equivalence
  const originalOpRecords = original.records.filter(
    (r): r is OperatorActionRecord | CompensationActionRecord =>
      r.tag === "OperatorAction" || r.tag === "CompensationAction"
  );

  const originalState = computeEffectiveOperatorState(originalOpRecords);
  const compactedState = compacted.snapshot.effectiveOperatorState;

  // Compare states
  return (
    JSON.stringify(originalState.acknowledgedConflicts) ===
      JSON.stringify(compactedState.acknowledgedConflicts) &&
    JSON.stringify(originalState.activeRebindRequests) ===
      JSON.stringify(compactedState.activeRebindRequests) &&
    originalState.notes.length === compactedState.notes.length &&
    originalState.compensatedSeqs.length === compactedState.compensatedSeqs.length
  );
}

/**
 * Get tail records from compacted journal.
 */
export function getTail(
  compacted: CompactedJournal
): Array<OperatorActionRecord | CompensationActionRecord> {
  return compacted.tail;
}

/**
 * Check if compaction point is valid.
 */
export function isValidCompactionPoint(journal: Journal, atSeq: number): boolean {
  return atSeq >= 1 && atSeq < journal.nextSeq - 1;
}
