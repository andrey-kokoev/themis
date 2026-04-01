/**
 * Operator Intervention Types
 * 
 * Defines operator action protocol for human/runtime interaction.
 * Law families O1-O5 from lawbook 040.
 */

/**
 * Runtime state required for operator action evaluation.
 */
export type OperatorRuntimeState = {
  /** Known workspace ids */
  workspaces: string[];
  /** Known role ids */
  roles: string[];
  /** Current conflicts by workspace (from latest integration) */
  latestConflictsByWorkspace: Record<string, string[]>;
  /** Known profiles for rebind requests */
  knownProfiles: string[];
};

/**
 * Operator action variants.
 * Closed set per law O1.1.
 */
export type OperatorAction =
  | RetryIntegrationAction
  | AcknowledgeConflictAction
  | RequestRebindAction
  | RecordNoteAction;

/**
 * RetryIntegration: Request re-evaluation of workspace.
 */
export type RetryIntegrationAction = {
  tag: "RetryIntegration";
  workspaceId: string;
};

/**
 * AcknowledgeConflict: Record operator acknowledgment of conflict.
 */
export type AcknowledgeConflictAction = {
  tag: "AcknowledgeConflict";
  workspaceId: string;
  conflictTag: string;
};

/**
 * RequestRebind: Request role rebind to different profile.
 */
export type RequestRebindAction = {
  tag: "RequestRebind";
  roleId: string;
  targetProfile: string;
};

/**
 * RecordNote: Add operator note to scope target.
 */
export type RecordNoteAction = {
  tag: "RecordNote";
  scope: "workspace" | "role";
  targetId: string;
  note: string;
};

/**
 * Verdict for operator action evaluation.
 */
export type OperatorActionVerdict =
  | { tag: "Admissible"; replayable: boolean; reversible: boolean }
  | { tag: "Inadmissible"; reason: string };

/**
 * Journal record for operator actions.
 */
export type OperatorActionRecord = {
  tag: "OperatorAction";
  seq: number;
  at: number;
  action: OperatorAction;
  verdict: OperatorActionVerdict;
};
