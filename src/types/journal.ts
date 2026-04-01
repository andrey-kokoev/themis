/**
 * Journal Types
 * 
 * Types for durable runtime journal.
 */

import type { Workspace } from "./ast.js";
import type { Fact, IntegrationVerdict } from "./runtime-integration.js";

export type JournalRecord = {
  tag: "IntegrationEvaluated";
  seq: number;
  at: number; // logical timestamp
  workspaceHash: string;
  facts: Fact[];
  verdict: IntegrationVerdict;
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
    expected: IntegrationVerdict;
    actual: IntegrationVerdict;
  }>;
};

export type JournalInput = {
  workspace: Workspace;
  facts: Fact[];
  verdict: IntegrationVerdict;
};
