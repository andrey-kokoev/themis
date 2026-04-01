/**
 * Journal Retention and Compaction Types
 *
 * Types for replay-preserving journal compaction.
 * Law families R1-R6 from lawbook 052 (Task 024).
 */
import type { IntegrationVerdict } from "./runtime-integration.js";
import type { OperatorActionRecord } from "./journal.js";
import type { CompensationActionRecord } from "./operator-compensation.js";
/**
 * Effective operator state at a point in time.
 * Captures the cumulative effect of operator actions.
 */
export type EffectiveOperatorState = {
    /** Acknowledged conflicts by workspace */
    acknowledgedConflicts: Record<string, string[]>;
    /** Active rebind requests by role */
    activeRebindRequests: Record<string, string>;
    /** Notes by scope and target */
    notes: Array<{
        scope: "workspace" | "role";
        targetId: string;
        note: string;
        seq: number;
    }>;
    /** Compensated (withdrawn) action seqs */
    compensatedSeqs: number[];
};
/**
 * Snapshot of journal state at a specific sequence point.
 */
export type JournalSnapshot = {
    tag: "JournalSnapshot";
    seq: number;
    /** Workspace hashes by some identifier */
    workspaceHashes: Record<string, string>;
    /** Latest integration verdicts by workspace */
    integrationVerdicts: Record<string, IntegrationVerdict>;
    /** Effective operator state at this point */
    effectiveOperatorState: EffectiveOperatorState;
};
/**
 * Compacted journal: snapshot + tail.
 */
export type CompactedJournal = {
    tag: "CompactedJournal";
    snapshot: JournalSnapshot;
    /** Records after snapshot point */
    tail: Array<OperatorActionRecord | CompensationActionRecord>;
    /** Next sequence number */
    nextSeq: number;
};
/**
 * Verdict for compaction operation.
 */
export type CompactionVerdict = {
    tag: "Compacted";
    compacted: CompactedJournal;
} | {
    tag: "CompactionFailed";
    reason: string;
};
//# sourceMappingURL=journal-compaction.d.ts.map