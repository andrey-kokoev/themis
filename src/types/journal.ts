/**
 * Journal Types
 * 
 * Types for durable runtime journal.
 */

import type { Workspace } from "./ast.js";
import type { Fact, IntegrationVerdict } from "./runtime-integration.js";
import type { OperatorAction, OperatorActionVerdict } from "./operator-intervention.js";

/**
 * Union of all journal record types.
 * Law O5: Operator actions are first-class records.
 */
export type JournalRecord =
  | IntegrationRecord
  | OperatorActionRecord;

/**
 * Integration evaluation record.
 */
export type IntegrationRecord = {
  tag: "IntegrationEvaluated";
  seq: number;
  at: number; // logical timestamp
  workspaceHash: string;
  facts: Fact[];
  verdict: IntegrationVerdict;
};

/**
 * Operator action record.
 * Law O5: Operator actions are journalable as runtime history.
 */
export type OperatorActionRecord = {
  tag: "OperatorAction";
  seq: number;
  at: number;
  action: OperatorAction;
  verdict: OperatorActionVerdict;
};

export type Journal = {
  records: JournalRecord[];
  nextSeq: number;
};

export type ReplayResult = {
  ok: boolean;
  firstFailureSeq?: number;
  mismatches?: Array<{
    seq: number;
    expected: unknown;
    actual: unknown;
  }>;
};

export type JournalInput = {
  workspace: Workspace;
  facts: Fact[];
  verdict: IntegrationVerdict;
};
