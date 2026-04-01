/**
 * Operator Action Compensation Tests
 * 
 * Tests for Task 022: Operator Action Replay Compensation Semantics
 * Covers law families C1-C4 from lawbook 048.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateCompensation,
  getCompensableActions,
  canCompensate,
} from "../src/runtime/operator-compensation.js";
import type {
  CompensationRuntimeState,
  WithdrawConflictAcknowledgmentAction,
  CancelRebindRequestAction,
  RetractNoteAction,
} from "../src/types/operator-compensation.js";
import type { OperatorActionRecord } from "../src/types/journal.js";

// Helper to create test state
function createState(
  actions: OperatorActionRecord[] = [],
  compensated: number[] = []
): CompensationRuntimeState {
  return {
    operatorActions: actions,
    compensatedSeqs: compensated,
  };
}

// Helper to create operator action record
function createOpRecord(
  seq: number,
  tag: string,
  extra: Record<string, unknown> = {}
): OperatorActionRecord {
  return {
    tag: "OperatorAction",
    seq,
    at: seq,
    action: { tag, ...extra } as unknown as OperatorActionRecord["action"],
    verdict: { tag: "Admissible", replayable: true, reversible: true },
  };
}

describe("Operator Action Compensation (C1-C4)", () => {
  describe("C1: Compensation Not Deletion", () => {
    it("compensation evaluates target action without deleting it", () => {
      const targetAction = createOpRecord(1, "AcknowledgeConflict", {
        workspaceId: "ws1",
        conflictTag: "MissingSubject",
      });
      const state = createState([targetAction]);

      const action: WithdrawConflictAcknowledgmentAction = {
        tag: "WithdrawConflictAcknowledgment",
        workspaceId: "ws1",
        conflictTag: "MissingSubject",
        compensatesSeq: 1,
      };

      const verdict = evaluateCompensation(state, action);

      // Action is compensable
      expect(verdict.tag).toBe("Compensable");
      // Original action still exists in state
      expect(state.operatorActions).toHaveLength(1);
      expect(state.operatorActions[0].seq).toBe(1);
    });
  });

  describe("C2: Reversible Action Compensation", () => {
    describe("WithdrawConflictAcknowledgment", () => {
      it("compensates AcknowledgeConflict when parameters match", () => {
        const targetAction = createOpRecord(1, "AcknowledgeConflict", {
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        });
        const state = createState([targetAction]);

        const action: WithdrawConflictAcknowledgmentAction = {
          tag: "WithdrawConflictAcknowledgment",
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Compensable");
      });

      it("rejected when target is not AcknowledgeConflict", () => {
        const targetAction = createOpRecord(1, "RequestRebind", {
          roleId: "role1",
          targetProfile: "tmux",
        });
        const state = createState([targetAction]);

        const action: WithdrawConflictAcknowledgmentAction = {
          tag: "WithdrawConflictAcknowledgment",
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("RequestRebind");
      });

      it("rejected when workspaceId does not match", () => {
        const targetAction = createOpRecord(1, "AcknowledgeConflict", {
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        });
        const state = createState([targetAction]);

        const action: WithdrawConflictAcknowledgmentAction = {
          tag: "WithdrawConflictAcknowledgment",
          workspaceId: "ws2", // Wrong workspace
          conflictTag: "MissingSubject",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("WorkspaceId mismatch");
      });

      it("rejected when conflictTag does not match", () => {
        const targetAction = createOpRecord(1, "AcknowledgeConflict", {
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        });
        const state = createState([targetAction]);

        const action: WithdrawConflictAcknowledgmentAction = {
          tag: "WithdrawConflictAcknowledgment",
          workspaceId: "ws1",
          conflictTag: "OtherConflict", // Wrong conflict
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("ConflictTag mismatch");
      });
    });

    describe("CancelRebindRequest", () => {
      it("compensates RequestRebind when roleId matches", () => {
        const targetAction = createOpRecord(1, "RequestRebind", {
          roleId: "role1",
          targetProfile: "tmux",
        });
        const state = createState([targetAction]);

        const action: CancelRebindRequestAction = {
          tag: "CancelRebindRequest",
          roleId: "role1",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Compensable");
      });

      it("rejected when target is not RequestRebind", () => {
        const targetAction = createOpRecord(1, "AcknowledgeConflict", {
          workspaceId: "ws1",
          conflictTag: "c1",
        });
        const state = createState([targetAction]);

        const action: CancelRebindRequestAction = {
          tag: "CancelRebindRequest",
          roleId: "role1",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("AcknowledgeConflict");
      });

      it("rejected when roleId does not match", () => {
        const targetAction = createOpRecord(1, "RequestRebind", {
          roleId: "role1",
          targetProfile: "tmux",
        });
        const state = createState([targetAction]);

        const action: CancelRebindRequestAction = {
          tag: "CancelRebindRequest",
          roleId: "role2", // Wrong role
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("RoleId mismatch");
      });
    });

    describe("RetractNote", () => {
      it("compensates RecordNote when scope and targetId match", () => {
        const targetAction = createOpRecord(1, "RecordNote", {
          scope: "workspace",
          targetId: "ws1",
          note: "Note content",
        });
        const state = createState([targetAction]);

        const action: RetractNoteAction = {
          tag: "RetractNote",
          scope: "workspace",
          targetId: "ws1",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Compensable");
      });

      it("rejected when target is not RecordNote", () => {
        const targetAction = createOpRecord(1, "AcknowledgeConflict", {
          workspaceId: "ws1",
          conflictTag: "c1",
        });
        const state = createState([targetAction]);

        const action: RetractNoteAction = {
          tag: "RetractNote",
          scope: "workspace",
          targetId: "ws1",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("AcknowledgeConflict");
      });

      it("rejected when scope does not match", () => {
        const targetAction = createOpRecord(1, "RecordNote", {
          scope: "workspace",
          targetId: "ws1",
          note: "Note",
        });
        const state = createState([targetAction]);

        const action: RetractNoteAction = {
          tag: "RetractNote",
          scope: "role", // Wrong scope
          targetId: "ws1",
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("Scope mismatch");
      });

      it("rejected when targetId does not match", () => {
        const targetAction = createOpRecord(1, "RecordNote", {
          scope: "workspace",
          targetId: "ws1",
          note: "Note",
        });
        const state = createState([targetAction]);

        const action: RetractNoteAction = {
          tag: "RetractNote",
          scope: "workspace",
          targetId: "ws2", // Wrong target
          compensatesSeq: 1,
        };

        const verdict = evaluateCompensation(state, action);

        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("TargetId mismatch");
      });
    });
  });

  describe("C3: Compensation Chain Validity", () => {
    it("no double compensation - action may be compensated at most once", () => {
      const targetAction = createOpRecord(1, "AcknowledgeConflict", {
        workspaceId: "ws1",
        conflictTag: "c1",
      });
      // Already compensated
      const state = createState([targetAction], [1]);

      const action: WithdrawConflictAcknowledgmentAction = {
        tag: "WithdrawConflictAcknowledgment",
        workspaceId: "ws1",
        conflictTag: "c1",
        compensatesSeq: 1,
      };

      const verdict = evaluateCompensation(state, action);

      expect(verdict.tag).toBe("Inadmissible");
      expect(verdict.reason).toContain("already compensated");
    });

    it("getCompensableActions returns only uncompensated reversible actions", () => {
      const actions: OperatorActionRecord[] = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
        createOpRecord(2, "RequestRebind", { roleId: "role1", targetProfile: "tmux" }),
        createOpRecord(3, "RetryIntegration", { workspaceId: "ws1" }), // Not reversible
      ];
      // Compensate action 1
      const state = createState(actions, [1]);

      const compensable = getCompensableActions(state);

      // Only action 2 should be compensable (reversible and not compensated)
      expect(compensable).toHaveLength(1);
      expect(compensable[0].seq).toBe(2);
    });

    it("canCompensate returns true only for compensable actions", () => {
      const actions: OperatorActionRecord[] = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
      ];
      const state = createState(actions);

      expect(canCompensate(state, 1)).toBe(true);
      expect(canCompensate(state, 2)).toBe(false); // Doesn't exist
    });

    it("inadmissible actions are not compensable", () => {
      const inadmissibleAction: OperatorActionRecord = {
        tag: "OperatorAction",
        seq: 1,
        at: 1,
        action: { tag: "AcknowledgeConflict", workspaceId: "ws1", conflictTag: "c1" },
        verdict: { tag: "Inadmissible", reason: "Not found" },
      };
      const state = createState([inadmissibleAction]);

      const compensable = getCompensableActions(state);

      expect(compensable).toHaveLength(0);
    });
  });

  describe("C4: Auditability", () => {
    it("compensation action includes compensatesSeq for audit trail", () => {
      const action: WithdrawConflictAcknowledgmentAction = {
        tag: "WithdrawConflictAcknowledgment",
        workspaceId: "ws1",
        conflictTag: "c1",
        compensatesSeq: 42,
      };

      expect(action.compensatesSeq).toBe(42);
    });

    it("compensation link creates unambiguous audit trail", () => {
      const targetAction = createOpRecord(5, "RecordNote", {
        scope: "workspace",
        targetId: "ws1",
        note: "Original note",
      });
      const state = createState([targetAction]);

      const action: RetractNoteAction = {
        tag: "RetractNote",
        scope: "workspace",
        targetId: "ws1",
        compensatesSeq: 5, // Links to seq 5
      };

      const verdict = evaluateCompensation(state, action);

      expect(verdict.tag).toBe("Compensable");
      // The compensatesSeq field creates the audit link
      expect(action.compensatesSeq).toBe(targetAction.seq);
    });
  });
});
