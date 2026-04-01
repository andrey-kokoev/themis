/**
 * Durable Runtime Journal (Extended for Operator Actions)
 *
 * Implements journal laws J1-J5 from lawbook 034.
 * Implements operator intervention laws O4-O5 from lawbook 040.
 * Append-only recording with deterministic replay.
 */
import type { Workspace } from "../types/ast.js";
import type { Journal, JournalRecord, JournalInput, ReplayResult, OperatorActionRecord } from "../types/journal.js";
import type { OperatorAction, OperatorActionVerdict } from "../types/operator-intervention.js";
/**
 * Hash a workspace using its canonical rendering.
 *
 * Law J3: Workspace identity via canonical hash
 */
export declare function hashWorkspace(workspace: Workspace): string;
/**
 * Create a new empty journal.
 */
export declare function createJournal(): Journal;
/**
 * Append an integration record to the journal.
 *
 * Law J1: Append-only
 * Law J2: Monotone sequence and logical time
 * Law J3: Workspace identity
 */
export declare function append(journal: Journal, input: JournalInput): Journal;
/**
 * Append an operator action record to the journal.
 *
 * Law O5: Operator actions are journalable as first-class records.
 * Law J1-J2: Same append-only and sequencing rules apply.
 */
export declare function appendOperatorAction(journal: Journal, action: OperatorAction, verdict: OperatorActionVerdict): Journal;
/**
 * Replay journal and verify all records.
 *
 * Law J4: Replay correctness for integration records.
 * Law O4: Replay semantics for operator actions.
 */
export declare function replay(journal: Journal, workspaceResolver: (hash: string) => Workspace | undefined, stateResolver: (workspaceHash: string) => {
    workspaces: string[];
    roles: string[];
    latestConflictsByWorkspace: Record<string, string[]>;
    knownProfiles: string[];
} | undefined): ReplayResult;
/**
 * Get the last record in the journal.
 */
export declare function lastRecord(journal: Journal): JournalRecord | undefined;
/**
 * Get record by sequence number.
 */
export declare function getRecord(journal: Journal, seq: number): JournalRecord | undefined;
/**
 * Get all operator action records from journal.
 * Law O5: Operator actions are visible in journal.
 */
export declare function getOperatorActions(journal: Journal): OperatorActionRecord[];
//# sourceMappingURL=journal.d.ts.map