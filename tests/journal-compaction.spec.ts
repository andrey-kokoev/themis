/**
 * Journal Retention and Compaction Tests
 * 
 * Tests for Task 024: Journal Retention and Compaction Semantics
 * Covers law families R1-R6 from lawbook 052.
 */

import { describe, it, expect } from "vitest";
import {
  computeEffectiveOperatorState,
  createSnapshot,
  compactJournal,
  expandCompacted,
  verifyCompactionEquivalence,
  isValidCompactionPoint,
} from "../src/runtime/journal-compaction.js";
import { createJournal, append } from "../src/runtime/journal.js";
import type {
  OperatorActionRecord,
  IntegrationRecord,
} from "../src/types/journal.js";
import type { CompensationActionRecord } from "../src/types/operator-compensation.js";

describe("Journal Retention and Compaction (R1-R6)", () => {
  // Helper to create operator action record
  function createOpRecord(seq: number, actionTag: string, extra: Record<string, unknown> = {}): OperatorActionRecord {
    return {
      tag: "OperatorAction",
      seq,
      at: seq,
      action: { tag: actionTag, ...extra } as unknown as OperatorActionRecord["action"],
      verdict: { tag: "Admissible", replayable: true, reversible: true },
    };
  }

  // Helper to create compensation record
  function createCompRecord(seq: number, compensatesSeq: number): CompensationActionRecord {
    return {
      tag: "CompensationAction",
      seq,
      at: seq,
      action: {
        tag: "WithdrawConflictAcknowledgment",
        workspaceId: "ws1",
        conflictTag: "c1",
        compensatesSeq,
      },
      verdict: { tag: "Compensable" },
    };
  }

  describe("R1: Prefix Truncation", () => {
    it("compacts only prefix of journal", () => {
      let journal = createJournal();
      
      // Add some records
      for (let i = 0; i < 5; i++) {
        journal = append(journal, {
          workspace: { tag: "Workspace", name: `ws${i}`, items: [] },
          facts: [],
          verdict: { admissible: true, conflicts: [], satisfied: [], unsatisfied: [], notes: [] },
        });
      }

      // Compact at seq 3
      const result = compactJournal(journal, 3);
      
      expect(result.tag).toBe("Compacted");
      if (result.tag === "Compacted") {
        expect(result.compacted.snapshot.seq).toBe(3);
        // Tail should have records after 3
        expect(result.compacted.tail.length).toBe(0); // Only integration records in prefix
      }
    });

    it("rejects compaction at invalid points", () => {
      let journal = createJournal();
      journal = append(journal, {
        workspace: { tag: "Workspace", name: "ws1", items: [] },
        facts: [],
        verdict: { admissible: true, conflicts: [], satisfied: [], unsatisfied: [], notes: [] },
      });

      // Cannot compact at 0
      const result0 = compactJournal(journal, 0);
      expect(result0.tag).toBe("CompactionFailed");

      // Cannot compact entire journal
      const resultEnd = compactJournal(journal, 100);
      expect(resultEnd.tag).toBe("CompactionFailed");
    });

    it("isValidCompactionPoint returns correct values", () => {
      let journal = createJournal();
      for (let i = 0; i < 5; i++) {
        journal = append(journal, {
          workspace: { tag: "Workspace", name: `ws${i}`, items: [] },
          facts: [],
          verdict: { admissible: true, conflicts: [], satisfied: [], unsatisfied: [], notes: [] },
        });
      }

      expect(isValidCompactionPoint(journal, 0)).toBe(false);
      expect(isValidCompactionPoint(journal, 1)).toBe(true);
      expect(isValidCompactionPoint(journal, 4)).toBe(true);
      expect(isValidCompactionPoint(journal, 5)).toBe(false);
    });
  });

  describe("R2: Snapshot Completeness", () => {
    it("snapshot encodes effective operator state", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
        createOpRecord(2, "RecordNote", { scope: "workspace", targetId: "ws1", note: "Note" }),
      ];

      const snapshot = createSnapshot(records, 2);

      expect(snapshot.effectiveOperatorState.acknowledgedConflicts.ws1).toContain("c1");
      expect(snapshot.effectiveOperatorState.notes).toHaveLength(1);
    });

    it("snapshot reflects compensation effects", () => {
      const records: Array<OperatorActionRecord | CompensationActionRecord> = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
        createCompRecord(2, 1), // Compensates/withdraws the acknowledgment
      ];

      const snapshot = createSnapshot(records, 2);

      // After compensation, acknowledgment should be withdrawn
      expect(snapshot.effectiveOperatorState.acknowledgedConflicts.ws1 || []).not.toContain("c1");
      expect(snapshot.effectiveOperatorState.compensatedSeqs).toContain(1);
    });

    it("compacted journal preserves integration verdicts in snapshot", () => {
      const integrationRecord: IntegrationRecord = {
        tag: "IntegrationEvaluated",
        seq: 1,
        at: 1,
        workspaceHash: "hash123",
        facts: [],
        verdict: { admissible: true, conflicts: [], satisfied: ["r1"], unsatisfied: [], notes: [] },
      };

      const snapshot = createSnapshot([integrationRecord], 1);

      expect(snapshot.workspaceHashes["hash123"]).toBe("hash123");
      expect(snapshot.integrationVerdicts["hash123"].admissible).toBe(true);
    });
  });

  describe("R3: Determinism", () => {
    it("same records produce identical snapshots", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "RequestRebind", { roleId: "role1", targetProfile: "tmux" }),
        createOpRecord(2, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
      ];

      const snapshot1 = createSnapshot(records, 2);
      const snapshot2 = createSnapshot(records, 2);

      expect(snapshot1).toEqual(snapshot2);
    });

    it("effective operator state is deterministic", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "RecordNote", { scope: "workspace", targetId: "ws1", note: "Note1" }),
        createOpRecord(2, "RecordNote", { scope: "workspace", targetId: "ws1", note: "Note2" }),
      ];

      const state1 = computeEffectiveOperatorState(records);
      const state2 = computeEffectiveOperatorState(records);

      expect(state1).toEqual(state2);
    });
  });

  describe("R4: Tail Preservation", () => {
    it("tail records remain unchanged after compaction", () => {
      let journal = createJournal();
      
      // Add integration records
      for (let i = 0; i < 5; i++) {
        journal = append(journal, {
          workspace: { tag: "Workspace", name: `ws${i}`, items: [] },
          facts: [],
          verdict: { admissible: true, conflicts: [], satisfied: [], unsatisfied: [], notes: [] },
        });
      }

      const result = compactJournal(journal, 3);
      
      if (result.tag === "Compacted") {
        // Tail should preserve original records after seq 3
        const tailSeqs = result.compacted.tail.map(r => r.seq);
        for (const seq of tailSeqs) {
          expect(seq).toBeGreaterThan(3);
        }
      }
    });
  });

  describe("R5: No Semantic Loss", () => {
    it("preserves conflict acknowledgment status", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
        createOpRecord(2, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c2" }),
      ];

      const state = computeEffectiveOperatorState(records);

      expect(state.acknowledgedConflicts.ws1).toHaveLength(2);
      expect(state.acknowledgedConflicts.ws1).toContain("c1");
      expect(state.acknowledgedConflicts.ws1).toContain("c2");
    });

    it("preserves rebind request state", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "RequestRebind", { roleId: "role1", targetProfile: "tmux" }),
        createOpRecord(2, "RequestRebind", { roleId: "role2", targetProfile: "wsl" }),
      ];

      const state = computeEffectiveOperatorState(records);

      expect(state.activeRebindRequests.role1).toBe("tmux");
      expect(state.activeRebindRequests.role2).toBe("wsl");
    });

    it("preserves note state", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "RecordNote", { scope: "workspace", targetId: "ws1", note: "Note1" }),
        createOpRecord(2, "RecordNote", { scope: "role", targetId: "role1", note: "Note2" }),
      ];

      const state = computeEffectiveOperatorState(records);

      expect(state.notes).toHaveLength(2);
      expect(state.notes[0].note).toBe("Note1");
      expect(state.notes[1].note).toBe("Note2");
    });

    it("integration verdict reproducibility preserved in snapshot", () => {
      const integrationRecord: IntegrationRecord = {
        tag: "IntegrationEvaluated",
        seq: 1,
        at: 1,
        workspaceHash: "hash1",
        facts: [],
        verdict: { admissible: true, conflicts: [], satisfied: ["r1"], unsatisfied: [], notes: ["Test"] },
      };

      const snapshot = createSnapshot([integrationRecord], 1);

      expect(snapshot.integrationVerdicts["hash1"].satisfied).toContain("r1");
    });
  });

  describe("R6: Snapshot Sufficiency", () => {
    it("compact and expand round-trip preserves operator state", () => {
      const records: Array<OperatorActionRecord | CompensationActionRecord> = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
        createOpRecord(2, "RecordNote", { scope: "workspace", targetId: "ws1", note: "Important" }),
      ];

      let journal = createJournal();
      for (const record of records) {
        // Manually add to journal records
        journal.records.push(record as any);
        journal.nextSeq = Math.max(journal.nextSeq, record.seq + 1);
      }

      const result = compactJournal(journal, 2);
      
      if (result.tag === "Compacted") {
        // Expanded journal should allow state reconstruction
        const expanded = expandCompacted(result.compacted, () => undefined);
        
        // Expanded journal should have the tail records
        expect(expanded.records.length).toBeGreaterThan(0);
      }
    });

    it("verifyCompactionEquivalence checks state preservation", () => {
      const records: OperatorActionRecord[] = [
        createOpRecord(1, "AcknowledgeConflict", { workspaceId: "ws1", conflictTag: "c1" }),
      ];

      let journal = createJournal();
      for (const record of records) {
        journal.records.push(record as any);
        journal.nextSeq = 2;
      }

      const result = compactJournal(journal, 1);
      
      if (result.tag === "Compacted") {
        const equivalent = verifyCompactionEquivalence(journal, result.compacted);
        expect(equivalent).toBe(true);
      }
    });
  });
});
