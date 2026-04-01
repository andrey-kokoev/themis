/**
 * Durable Runtime Journal (Extended for Operator Actions)
 * 
 * Implements journal laws J1-J5 from lawbook 034.
 * Implements operator intervention laws O4-O5 from lawbook 040.
 * Append-only recording with deterministic replay.
 */

import type { Workspace } from "../types/ast.js";
import type { 
  Journal, 
  JournalRecord, 
  JournalInput, 
  ReplayResult,
  OperatorActionRecord,
} from "../types/journal.js";
import type { IntegrationVerdict } from "../types/runtime-integration.js";
import type { OperatorAction, OperatorActionVerdict } from "../types/operator-intervention.js";
import { render } from "../renderer/canonical-renderer.js";
import { integrate } from "./integration.js";
import { canReplayAction } from "./operator-intervention.js";

/**
 * Simple hash function for workspace canonical rendering.
 * Not cryptographically secure - just needs to be stable.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Hash a workspace using its canonical rendering.
 * 
 * Law J3: Workspace identity via canonical hash
 */
export function hashWorkspace(workspace: Workspace): string {
  const canonical = render(workspace);
  return hashString(canonical);
}

/**
 * Create a new empty journal.
 */
export function createJournal(): Journal {
  return {
    records: [],
    nextSeq: 1,
  };
}

/**
 * Append an integration record to the journal.
 * 
 * Law J1: Append-only
 * Law J2: Monotone sequence and logical time
 * Law J3: Workspace identity
 */
export function append(
  journal: Journal,
  input: JournalInput
): Journal {
  const { workspace, facts, verdict } = input;
  
  // J2.1: Strictly increasing sequence
  const seq = journal.nextSeq;
  
  // J2.2: Logical time (monotone with seq)
  const at = seq;
  
  // J3: Workspace hash
  const workspaceHash = hashWorkspace(workspace);
  
  const record: JournalRecord = {
    tag: "IntegrationEvaluated",
    seq,
    at,
    workspaceHash,
    facts,
    verdict,
  };
  
  // J1: Append-only (create new journal, don't mutate)
  return {
    records: [...journal.records, record],
    nextSeq: seq + 1,
  };
}

/**
 * Append an operator action record to the journal.
 * 
 * Law O5: Operator actions are journalable as first-class records.
 * Law J1-J2: Same append-only and sequencing rules apply.
 */
export function appendOperatorAction(
  journal: Journal,
  action: OperatorAction,
  verdict: OperatorActionVerdict
): Journal {
  // J2.1: Strictly increasing sequence
  const seq = journal.nextSeq;
  
  // J2.2: Logical time
  const at = seq;
  
  const record: OperatorActionRecord = {
    tag: "OperatorAction",
    seq,
    at,
    action,
    verdict,
  };
  
  // J1: Append-only
  return {
    records: [...journal.records, record],
    nextSeq: seq + 1,
  };
}

/**
 * Replay journal and verify all records.
 * 
 * Law J4: Replay correctness for integration records.
 * Law O4: Replay semantics for operator actions.
 */
export function replay(
  journal: Journal,
  workspaceResolver: (hash: string) => Workspace | undefined,
  stateResolver: (workspaceHash: string) => {
    workspaces: string[];
    roles: string[];
    latestConflictsByWorkspace: Record<string, string[]>;
    knownProfiles: string[];
  } | undefined
): ReplayResult {
  const mismatches: Array<{
    seq: number;
    expected: unknown;
    actual: unknown;
  }> = [];
  
  for (const record of journal.records) {
    if (record.tag === "IntegrationEvaluated") {
      // Replay integration record
      const workspace = workspaceResolver(record.workspaceHash);
      if (!workspace) {
        return {
          ok: false,
          firstFailureSeq: record.seq,
          mismatches: [{
            seq: record.seq,
            expected: record.verdict,
            actual: {
              admissible: false,
              conflicts: [{
                type: "WorkspaceNotFound",
                message: `Workspace with hash "${record.workspaceHash}" not found`,
              }],
              satisfied: [],
              unsatisfied: [],
            },
          }],
        };
      }
      
      // Recompute verdict
      const recomputed = integrate({ workspace, facts: record.facts });
      
      // J4: Check equality with stored verdict
      if (!verdictsEqual(recomputed, record.verdict)) {
        mismatches.push({
          seq: record.seq,
          expected: record.verdict,
          actual: recomputed,
        });
      }
    } else if (record.tag === "OperatorAction") {
      // Law O4: Replay operator action
      const state = stateResolver?.("");
      if (!state) {
        mismatches.push({
          seq: record.seq,
          expected: record.verdict,
          actual: { tag: "Inadmissible", reason: "State not available for replay" },
        });
        continue;
      }
      
      const replayCheck = canReplayAction(state, record.action);
      if (!replayCheck.canReplay) {
        mismatches.push({
          seq: record.seq,
          expected: record.verdict,
          actual: { tag: "Inadmissible", reason: replayCheck.reason },
        });
      }
    }
  }
  
  if (mismatches.length > 0) {
    return {
      ok: false,
      firstFailureSeq: mismatches[0].seq,
      mismatches,
    };
  }
  
  return { ok: true };
}

/**
 * Check if two IntegrationVerdicts are equal.
 */
function verdictsEqual(a: IntegrationVerdict, b: IntegrationVerdict): boolean {
  if (a.admissible !== b.admissible) return false;
  if (a.satisfied.length !== b.satisfied.length) return false;
  if (a.unsatisfied.length !== b.unsatisfied.length) return false;
  if (a.conflicts.length !== b.conflicts.length) return false;
  
  // Check satisfied roles
  const aSatisfied = [...a.satisfied].sort();
  const bSatisfied = [...b.satisfied].sort();
  for (let i = 0; i < aSatisfied.length; i++) {
    if (aSatisfied[i] !== bSatisfied[i]) return false;
  }
  
  // Check unsatisfied roles
  const aUnsatisfied = [...a.unsatisfied].sort();
  const bUnsatisfied = [...b.unsatisfied].sort();
  for (let i = 0; i < aUnsatisfied.length; i++) {
    if (aUnsatisfied[i] !== bUnsatisfied[i]) return false;
  }
  
  // Check conflicts
  const aConflicts = [...a.conflicts].sort((x, y) => x.type.localeCompare(y.type));
  const bConflicts = [...b.conflicts].sort((x, y) => x.type.localeCompare(y.type));
  for (let i = 0; i < aConflicts.length; i++) {
    if (aConflicts[i].type !== bConflicts[i].type) return false;
    if (aConflicts[i].message !== bConflicts[i].message) return false;
  }
  
  return true;
}

/**
 * Get the last record in the journal.
 */
export function lastRecord(journal: Journal): JournalRecord | undefined {
  return journal.records[journal.records.length - 1];
}

/**
 * Get record by sequence number.
 */
export function getRecord(journal: Journal, seq: number): JournalRecord | undefined {
  return journal.records.find(r => r.seq === seq);
}

/**
 * Get all operator action records from journal.
 * Law O5: Operator actions are visible in journal.
 */
export function getOperatorActions(journal: Journal): OperatorActionRecord[] {
  return journal.records.filter(
    (r): r is OperatorActionRecord => r.tag === "OperatorAction"
  );
}
