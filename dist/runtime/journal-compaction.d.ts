/**
 * Journal Retention and Compaction
 *
 * Implements lawbook 052 (Task 024).
 * Replay-preserving compaction for runtime journal.
 */
import type { Journal, JournalRecord } from "../types/journal.js";
import type { JournalSnapshot, CompactedJournal, EffectiveOperatorState, CompactionVerdict } from "../types/journal-compaction.js";
import type { OperatorActionRecord } from "../types/journal.js";
import type { CompensationActionRecord } from "../types/operator-compensation.js";
/**
 * Compute effective operator state from journal records.
 *
 * Reconstructs the cumulative effect of operator actions.
 */
export declare function computeEffectiveOperatorState(records: Array<OperatorActionRecord | CompensationActionRecord>): EffectiveOperatorState;
/**
 * Create a snapshot from journal records up to a given sequence point.
 *
 * Law R2: Snapshot encodes replay-relevant state.
 */
export declare function createSnapshot(records: JournalRecord[], upToSeq: number): JournalSnapshot;
/**
 * Compact journal at a given sequence point.
 *
 * Law R1: Only prefix may be compacted.
 * Law R2: Snapshot + tail must be replay-equivalent.
 */
export declare function compactJournal(journal: Journal, atSeq: number): CompactionVerdict;
/**
 * Expand compacted journal back to full journal for replay.
 *
 * This is the inverse operation that allows replay of compacted journals.
 */
export declare function expandCompacted(compacted: CompactedJournal, workspaceResolver: (hash: string) => unknown): Journal;
/**
 * Verify that compacted journal is replay-equivalent to original.
 *
 * Law R2: Replay equivalence check.
 */
export declare function verifyCompactionEquivalence(original: Journal, compacted: CompactedJournal): boolean;
/**
 * Get tail records from compacted journal.
 */
export declare function getTail(compacted: CompactedJournal): Array<OperatorActionRecord | CompensationActionRecord>;
/**
 * Check if compaction point is valid.
 */
export declare function isValidCompactionPoint(journal: Journal, atSeq: number): boolean;
//# sourceMappingURL=journal-compaction.d.ts.map