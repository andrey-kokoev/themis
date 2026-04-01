/**
 * Operator Intervention Protocol
 * 
 * Implements operator action evaluation (Task 018).
 * Law families O1-O5 from lawbook 040.
 */

import type {
  OperatorAction,
  OperatorActionVerdict,
  OperatorRuntimeState,
  RetryIntegrationAction,
  AcknowledgeConflictAction,
  RequestRebindAction,
  RecordNoteAction,
} from "../types/operator-intervention.js";

/**
 * Evaluate operator action against runtime state.
 * 
 * Law O2: Each action has explicit admissibility preconditions.
 * Law O3: No semantic override (actions don't assert satisfaction).
 * Law O4: Deterministic evaluation.
 */
export function evaluateOperatorAction(
  state: OperatorRuntimeState,
  action: OperatorAction
): OperatorActionVerdict {
  switch (action.tag) {
    case "RetryIntegration":
      return evaluateRetryIntegration(state, action);
    case "AcknowledgeConflict":
      return evaluateAcknowledgeConflict(state, action);
    case "RequestRebind":
      return evaluateRequestRebind(state, action);
    case "RecordNote":
      return evaluateRecordNote(state, action);
    default:
      // Law O1: Unknown action tag is inadmissible
      return {
        tag: "Inadmissible",
        reason: `Unknown operator action tag`,
      };
  }
}

/**
 * Evaluate RetryIntegration action.
 * 
 * Law O2.1: Admissible iff target workspace exists.
 * Replayable: yes
 * Reversible: no
 */
function evaluateRetryIntegration(
  state: OperatorRuntimeState,
  action: RetryIntegrationAction
): OperatorActionVerdict {
  if (!state.workspaces.includes(action.workspaceId)) {
    return {
      tag: "Inadmissible",
      reason: `Workspace "${action.workspaceId}" does not exist`,
    };
  }

  return {
    tag: "Admissible",
    replayable: true,
    reversible: false,
  };
}

/**
 * Evaluate AcknowledgeConflict action.
 * 
 * Law O2.2: Admissible iff workspace exists AND conflict is present.
 * Replayable: yes
 * Reversible: yes
 */
function evaluateAcknowledgeConflict(
  state: OperatorRuntimeState,
  action: AcknowledgeConflictAction
): OperatorActionVerdict {
  if (!state.workspaces.includes(action.workspaceId)) {
    return {
      tag: "Inadmissible",
      reason: `Workspace "${action.workspaceId}" does not exist`,
    };
  }

  const conflicts = state.latestConflictsByWorkspace[action.workspaceId] || [];
  if (!conflicts.includes(action.conflictTag)) {
    return {
      tag: "Inadmissible",
      reason: `Conflict "${action.conflictTag}" not present in workspace "${action.workspaceId}"`,
    };
  }

  return {
    tag: "Admissible",
    replayable: true,
    reversible: true,
  };
}

/**
 * Evaluate RequestRebind action.
 * 
 * Law O2.3: Admissible iff role exists AND profile is known.
 * Replayable: yes
 * Reversible: yes
 */
function evaluateRequestRebind(
  state: OperatorRuntimeState,
  action: RequestRebindAction
): OperatorActionVerdict {
  if (!state.roles.includes(action.roleId)) {
    return {
      tag: "Inadmissible",
      reason: `Role "${action.roleId}" does not exist`,
    };
  }

  if (!state.knownProfiles.includes(action.targetProfile)) {
    return {
      tag: "Inadmissible",
      reason: `Profile "${action.targetProfile}" is not known`,
    };
  }

  return {
    tag: "Admissible",
    replayable: true,
    reversible: true,
  };
}

/**
 * Evaluate RecordNote action.
 * 
 * Law O2.4: Admissible iff target exists AND note is non-empty.
 * Replayable: yes
 * Reversible: yes
 */
function evaluateRecordNote(
  state: OperatorRuntimeState,
  action: RecordNoteAction
): OperatorActionVerdict {
  const targetExists =
    action.scope === "workspace"
      ? state.workspaces.includes(action.targetId)
      : state.roles.includes(action.targetId);

  if (!targetExists) {
    return {
      tag: "Inadmissible",
      reason: `${action.scope} "${action.targetId}" does not exist`,
    };
  }

  if (!action.note || action.note.trim() === "") {
    return {
      tag: "Inadmissible",
      reason: "Note cannot be empty",
    };
  }

  return {
    tag: "Admissible",
    replayable: true,
    reversible: true,
  };
}

/**
 * Check if an action can be replayed given current state.
 * 
 * Law O4: Inadmissible replay must fail explicitly.
 */
export function canReplayAction(
  state: OperatorRuntimeState,
  action: OperatorAction
): { canReplay: boolean; reason?: string } {
  const verdict = evaluateOperatorAction(state, action);

  if (verdict.tag === "Inadmissible") {
    return { canReplay: false, reason: verdict.reason };
  }

  if (!verdict.replayable) {
    return { canReplay: false, reason: "Action is not marked as replayable" };
  }

  return { canReplay: true };
}
