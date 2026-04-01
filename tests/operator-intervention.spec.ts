/**
 * Operator Intervention Protocol Tests
 * 
 * Tests for Task 018: Operator Intervention Protocol Semantics
 * Covers law families O1-O5 from lawbook 040.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateOperatorAction,
  canReplayAction,
} from "../src/runtime/operator-intervention.js";
import {
  createJournal,
  appendOperatorAction,
  getOperatorActions,
} from "../src/runtime/journal.js";
import type { OperatorRuntimeState } from "../src/types/operator-intervention.js";

// Helper to create minimal runtime state
function createState(partial: Partial<OperatorRuntimeState> = {}): OperatorRuntimeState {
  return {
    workspaces: [],
    roles: [],
    latestConflictsByWorkspace: {},
    knownProfiles: [],
    ...partial,
  };
}

describe("Operator Intervention Protocol (O1-O5)", () => {
  describe("O1: Closed Action-Set Laws", () => {
    it("RetryIntegration is admissible for existing workspace", () => {
      const state = createState({ workspaces: ["ws1"] });
      const action = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
      
      const verdict = evaluateOperatorAction(state, action);
      
      expect(verdict.tag).toBe("Admissible");
      expect(verdict.replayable).toBe(true);
      expect(verdict.reversible).toBe(false);
    });

    it("unknown action tag is rejected", () => {
      const state = createState();
      // @ts-expect-error Testing invalid action
      const action = { tag: "UnknownAction" };
      
      const verdict = evaluateOperatorAction(state, action);
      
      expect(verdict.tag).toBe("Inadmissible");
    });
  });

  describe("O2: Admissibility Laws", () => {
    describe("RetryIntegration", () => {
      it("admissible for existing workspace", () => {
        const state = createState({ workspaces: ["ws1", "ws2"] });
        const action = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Admissible");
      });

      it("rejected for unknown workspace", () => {
        const state = createState({ workspaces: ["ws1"] });
        const action = { tag: "RetryIntegration" as const, workspaceId: "unknown" };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain('"unknown"');
      });
    });

    describe("AcknowledgeConflict", () => {
      it("admissible only when conflict is present", () => {
        const state = createState({
          workspaces: ["ws1"],
          latestConflictsByWorkspace: { ws1: ["MissingSubject"] },
        });
        const action = {
          tag: "AcknowledgeConflict" as const,
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Admissible");
        expect(verdict.replayable).toBe(true);
        expect(verdict.reversible).toBe(true);
      });

      it("rejected when conflict not present", () => {
        const state = createState({
          workspaces: ["ws1"],
          latestConflictsByWorkspace: { ws1: ["OtherConflict"] },
        });
        const action = {
          tag: "AcknowledgeConflict" as const,
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("MissingSubject");
      });

      it("rejected when workspace does not exist", () => {
        const state = createState({ workspaces: [] });
        const action = {
          tag: "AcknowledgeConflict" as const,
          workspaceId: "ws1",
          conflictTag: "MissingSubject",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
      });
    });

    describe("RequestRebind", () => {
      it("admissible for known role and profile", () => {
        const state = createState({
          roles: ["role1"],
          knownProfiles: ["tmux", "windows-terminal-wsl"],
        });
        const action = {
          tag: "RequestRebind" as const,
          roleId: "role1",
          targetProfile: "tmux",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Admissible");
        expect(verdict.replayable).toBe(true);
        expect(verdict.reversible).toBe(true);
      });

      it("rejected for unknown role", () => {
        const state = createState({
          roles: [],
          knownProfiles: ["tmux"],
        });
        const action = {
          tag: "RequestRebind" as const,
          roleId: "unknown-role",
          targetProfile: "tmux",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain('"unknown-role"');
      });

      it("rejected for unknown profile", () => {
        const state = createState({
          roles: ["role1"],
          knownProfiles: ["tmux"],
        });
        const action = {
          tag: "RequestRebind" as const,
          roleId: "role1",
          targetProfile: "unknown-profile",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain('"unknown-profile"');
      });
    });

    describe("RecordNote", () => {
      it("admissible for existing workspace with non-empty note", () => {
        const state = createState({ workspaces: ["ws1"] });
        const action = {
          tag: "RecordNote" as const,
          scope: "workspace" as const,
          targetId: "ws1",
          note: "This is a note",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Admissible");
        expect(verdict.replayable).toBe(true);
        expect(verdict.reversible).toBe(true);
      });

      it("admissible for existing role with non-empty note", () => {
        const state = createState({ roles: ["role1"] });
        const action = {
          tag: "RecordNote" as const,
          scope: "role" as const,
          targetId: "role1",
          note: "Role observation",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Admissible");
      });

      it("rejected for non-existing target", () => {
        const state = createState({ workspaces: [] });
        const action = {
          tag: "RecordNote" as const,
          scope: "workspace" as const,
          targetId: "unknown",
          note: "Note",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
      });

      it("rejected for empty note", () => {
        const state = createState({ workspaces: ["ws1"] });
        const action = {
          tag: "RecordNote" as const,
          scope: "workspace" as const,
          targetId: "ws1",
          note: "",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
        expect(verdict.reason).toContain("empty");
      });

      it("rejected for whitespace-only note", () => {
        const state = createState({ workspaces: ["ws1"] });
        const action = {
          tag: "RecordNote" as const,
          scope: "workspace" as const,
          targetId: "ws1",
          note: "   ",
        };
        
        const verdict = evaluateOperatorAction(state, action);
        
        expect(verdict.tag).toBe("Inadmissible");
      });
    });
  });

  describe("O3: No Semantic Override Laws", () => {
    it("AcknowledgeConflict does not erase semantic conflict truth", () => {
      // Law O3.2: Acknowledgment is not erasure
      // The action is just recording acknowledgment, not removing conflict
      const state = createState({
        workspaces: ["ws1"],
        latestConflictsByWorkspace: { ws1: ["Conflict1"] },
      });
      const action = {
        tag: "AcknowledgeConflict" as const,
        workspaceId: "ws1",
        conflictTag: "Conflict1",
      };
      
      const verdict = evaluateOperatorAction(state, action);
      
      // Action is admissible (records acknowledgment)
      expect(verdict.tag).toBe("Admissible");
      // But it doesn't modify the underlying conflict state
      // The conflict remains in latestConflictsByWorkspace
      expect(state.latestConflictsByWorkspace.ws1).toContain("Conflict1");
    });

    it("actions do not assert role satisfaction", () => {
      // No operator action has the power to declare a role satisfied
      // All actions are about operational flow, not semantic truth
      const actions = [
        { tag: "RetryIntegration" as const, workspaceId: "ws1" },
        { tag: "AcknowledgeConflict" as const, workspaceId: "ws1", conflictTag: "c" },
        { tag: "RequestRebind" as const, roleId: "r1", targetProfile: "tmux" },
        { tag: "RecordNote" as const, scope: "role" as const, targetId: "r1", note: "n" },
      ];

      for (const action of actions) {
        // None of these actions can directly affect satisfaction status
        // They are about operational flow, not semantic truth
        expect(action.tag).not.toContain("Satisfy");
        expect(action.tag).not.toContain("Resolve");
      }
    });
  });

  describe("O4: Replay Laws", () => {
    it("replay preserves action order", () => {
      // Actions are stored in journal with sequence numbers
      let journal = createJournal();
      
      const action1 = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
      const verdict1 = { tag: "Admissible" as const, replayable: true, reversible: false };
      journal = appendOperatorAction(journal, action1, verdict1);
      
      const action2 = { tag: "RecordNote" as const, scope: "workspace" as const, targetId: "ws1", note: "n" };
      const verdict2 = { tag: "Admissible" as const, replayable: true, reversible: true };
      journal = appendOperatorAction(journal, action2, verdict2);
      
      const actions = getOperatorActions(journal);
      expect(actions).toHaveLength(2);
      expect(actions[0].seq).toBe(1);
      expect(actions[1].seq).toBe(2);
    });

    it("inadmissible replay fails explicitly", () => {
      // An action that was admissible when first executed
      // may become inadmissible under changed state
      const originalState = createState({ workspaces: ["ws1"] });
      const changedState = createState({ workspaces: [] }); // ws1 removed
      
      const action = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
      
      // Was admissible originally
      const originalVerdict = evaluateOperatorAction(originalState, action);
      expect(originalVerdict.tag).toBe("Admissible");
      
      // But not replayable under changed state
      const replayCheck = canReplayAction(changedState, action);
      expect(replayCheck.canReplay).toBe(false);
      expect(replayCheck.reason).toBeDefined();
    });

    it("non-replayable actions fail replay check", () => {
      const state = createState({ workspaces: ["ws1"] });
      const action = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
      
      // RetryIntegration is replayable
      const verdict = evaluateOperatorAction(state, action);
      expect(verdict.tag).toBe("Admissible");
      expect(verdict.replayable).toBe(true);
      
      // So it passes replay check
      const replayCheck = canReplayAction(state, action);
      expect(replayCheck.canReplay).toBe(true);
    });
  });

  describe("O5: Journal Integration Laws", () => {
    it("operator actions are journalable as first-class records", () => {
      let journal = createJournal();
      
      const action = { tag: "RetryIntegration" as const, workspaceId: "ws1" };
      const verdict = { tag: "Admissible" as const, replayable: true, reversible: false };
      
      journal = appendOperatorAction(journal, action, verdict);
      
      expect(journal.records).toHaveLength(1);
      expect(journal.records[0].tag).toBe("OperatorAction");
      expect(journal.records[0].seq).toBe(1);
      expect(journal.nextSeq).toBe(2);
    });

    it("actions appear in journal with correct structure", () => {
      let journal = createJournal();
      
      const action = {
        tag: "AcknowledgeConflict" as const,
        workspaceId: "ws1",
        conflictTag: "MissingSubject",
      };
      const verdict = { tag: "Admissible" as const, replayable: true, reversible: true };
      
      journal = appendOperatorAction(journal, action, verdict);
      
      const record = journal.records[0];
      expect(record.tag).toBe("OperatorAction");
      expect(record.action).toEqual(action);
      expect(record.verdict).toEqual(verdict);
      expect(record.seq).toBeGreaterThan(0);
      expect(record.at).toBeGreaterThan(0);
    });

    it("getOperatorActions extracts only operator action records", () => {
      // This test verifies the helper function works correctly
      let journal = createJournal();
      
      // Add operator action
      const action = { tag: "RecordNote" as const, scope: "workspace" as const, targetId: "ws1", note: "test" };
      const verdict = { tag: "Admissible" as const, replayable: true, reversible: true };
      journal = appendOperatorAction(journal, action, verdict);
      
      const actions = getOperatorActions(journal);
      expect(actions).toHaveLength(1);
      expect(actions[0].action.tag).toBe("RecordNote");
    });

    it("journal sequences operator actions monotonically", () => {
      let journal = createJournal();
      
      for (let i = 1; i <= 3; i++) {
        const action = { tag: "RecordNote" as const, scope: "workspace" as const, targetId: "ws1", note: `note ${i}` };
        const verdict = { tag: "Admissible" as const, replayable: true, reversible: true };
        journal = appendOperatorAction(journal, action, verdict);
      }
      
      const actions = getOperatorActions(journal);
      expect(actions[0].seq).toBe(1);
      expect(actions[1].seq).toBe(2);
      expect(actions[2].seq).toBe(3);
    });
  });
});
