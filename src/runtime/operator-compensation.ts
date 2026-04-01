/**
 * Operator Action Compensation
 * 
 * Implements lawbook 048 (Task 022).
 * Evaluation and validation of compensation actions.
 */

import type {
  OperatorCompensationAction,
  CompensationVerdict,
  CompensationRuntimeState,
  WithdrawConflictAcknowledgmentAction,
  CancelRebindRequestAction,
  RetractNoteAction,
} from "../types/operator-compensation.js";
import type { OperatorActionRecord } from "../types/journal.js";

/**
 * Evaluate compensation action against runtime state.
 * 
 * Law C2: Reversible action compensation rules.
 * Law C3: Compensation chain validity.
 */
export function evaluateCompensation(
  state: CompensationRuntimeState,
  action: OperatorCompensationAction
): CompensationVerdict {
  // Law C3.1: Check not already compensated
  if (state.compensatedSeqs.includes(action.compensatesSeq)) {
    return {
      tag: "Inadmissible",
      reason: `Action at seq ${action.compensatesSeq} is already compensated`,
    };
  }

  // Find the target action
  const targetAction = state.operatorActions.find(
    a => a.seq === action.compensatesSeq
  );

  if (!targetAction) {
    return {
      tag: "Inadmissible",
      reason: `Target action at seq ${action.compensatesSeq} not found`,
    };
  }

  // Verify compensation matches target action type
  switch (action.tag) {
    case "WithdrawConflictAcknowledgment":
      return evaluateWithdrawConflictAcknowledgment(
        state,
        action,
        targetAction
      );
    case "CancelRebindRequest":
      return evaluateCancelRebindRequest(state, action, targetAction);
    case "RetractNote":
      return evaluateRetractNote(state, action, targetAction);
    default:
      return {
        tag: "Inadmissible",
        reason: "Unknown compensation action type",
      };
  }
}

/**
 * Evaluate WithdrawConflictAcknowledgment compensation.
 * 
 * Law C2.1: Compensates AcknowledgeConflict
 */
function evaluateWithdrawConflictAcknowledgment(
  state: CompensationRuntimeState,
  action: WithdrawConflictAcknowledgmentAction,
  targetAction: OperatorActionRecord
): CompensationVerdict {
  // Target must be AcknowledgeConflict
  if (targetAction.action.tag !== "AcknowledgeConflict") {
    return {
      tag: "Inadmissible",
      reason: `Target action is ${targetAction.action.tag}, not AcknowledgeConflict`,
    };
  }

  // Verify workspaceId matches
  if (targetAction.action.workspaceId !== action.workspaceId) {
    return {
      tag: "Inadmissible",
      reason: `WorkspaceId mismatch: ${action.workspaceId} vs ${targetAction.action.workspaceId}`,
    };
  }

  // Verify conflictTag matches
  if (targetAction.action.conflictTag !== action.conflictTag) {
    return {
      tag: "Inadmissible",
      reason: `ConflictTag mismatch: ${action.conflictTag} vs ${targetAction.action.conflictTag}`,
    };
  }

  return { tag: "Compensable" };
}

/**
 * Evaluate CancelRebindRequest compensation.
 * 
 * Law C2.2: Compensates RequestRebind
 */
function evaluateCancelRebindRequest(
  state: CompensationRuntimeState,
  action: CancelRebindRequestAction,
  targetAction: OperatorActionRecord
): CompensationVerdict {
  // Target must be RequestRebind
  if (targetAction.action.tag !== "RequestRebind") {
    return {
      tag: "Inadmissible",
      reason: `Target action is ${targetAction.action.tag}, not RequestRebind`,
    };
  }

  // Verify roleId matches
  if (targetAction.action.roleId !== action.roleId) {
    return {
      tag: "Inadmissible",
      reason: `RoleId mismatch: ${action.roleId} vs ${targetAction.action.roleId}`,
    };
  }

  return { tag: "Compensable" };
}

/**
 * Evaluate RetractNote compensation.
 * 
 * Law C2.3: Compensates RecordNote
 */
function evaluateRetractNote(
  state: CompensationRuntimeState,
  action: RetractNoteAction,
  targetAction: OperatorActionRecord
): CompensationVerdict {
  // Target must be RecordNote
  if (targetAction.action.tag !== "RecordNote") {
    return {
      tag: "Inadmissible",
      reason: `Target action is ${targetAction.action.tag}, not RecordNote`,
    };
  }

  // Verify scope matches
  if (targetAction.action.scope !== action.scope) {
    return {
      tag: "Inadmissible",
      reason: `Scope mismatch: ${action.scope} vs ${targetAction.action.scope}`,
    };
  }

  // Verify targetId matches
  if (targetAction.action.targetId !== action.targetId) {
    return {
      tag: "Inadmissible",
      reason: `TargetId mismatch: ${action.targetId} vs ${targetAction.action.targetId}`,
    };
  }

  return { tag: "Compensable" };
}

/**
 * Get list of compensable actions from journal.
 * 
 * Returns actions that are reversible and not yet compensated.
 */
export function getCompensableActions(
  state: CompensationRuntimeState
): OperatorActionRecord[] {
  return state.operatorActions.filter(a => {
    // Must be reversible action type
    const reversibleTypes = [
      "AcknowledgeConflict",
      "RequestRebind",
      "RecordNote",
    ];
    if (!reversibleTypes.includes(a.action.tag)) {
      return false;
    }

    // Must not already be compensated
    if (state.compensatedSeqs.includes(a.seq)) {
      return false;
    }

    // Must have been admissible
    if (a.verdict.tag === "Inadmissible") {
      return false;
    }

    return true;
  });
}

/**
 * Check if an action can be compensated.
 */
export function canCompensate(
  state: CompensationRuntimeState,
  seq: number
): boolean {
  return getCompensableActions(state).some(a => a.seq === seq);
}
