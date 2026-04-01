/**
 * Kernel Tests
 * 
 * Tests for K2-K5 kernel laws.
 */

import { describe, it, expect } from "vitest";
import {
  wellFormed,
  normalize,
  equiv,
  satisfiedRole,
  satisfiedWorkspace,
} from "../src/kernel/kernel.js";
import type { KernelWorkspace } from "../src/types/kernel.js";
import type { Fact } from "../src/types/runtime-integration.js";

// Helper to create minimal valid workspace
function createValidWorkspace(): KernelWorkspace {
  return {
    tag: "Workspace",
    id: "test-ws",
    context: new Map(),
    persistence: "ephemeral",
    equivalence: "canonical",
    roles: [
      {
        tag: "Role",
        id: "role1",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj1",
          reference: "ref1",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      },
    ],
    relations: [],
  };
}

describe("Kernel Laws", () => {
  describe("K2: Well-Formedness", () => {
    it("accepts valid workspace", () => {
      const ws = createValidWorkspace();
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(true);
    });

    it("rejects empty workspace id", () => {
      const ws = createValidWorkspace();
      ws.id = "";
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "EmptyWorkspaceId")).toBe(true);
      }
    });

    it("rejects workspace with no roles", () => {
      const ws = createValidWorkspace();
      ws.roles = [];
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "NoRolesInWorkspace")).toBe(true);
      }
    });

    it("rejects duplicate role ids", () => {
      const ws = createValidWorkspace();
      ws.roles.push({ ...ws.roles[0] });
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "DuplicateRoleId")).toBe(true);
      }
    });

    it("rejects duplicate subject identities", () => {
      const ws = createValidWorkspace();
      ws.roles.push({
        ...ws.roles[0],
        id: "role2",
      });
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "DuplicateSubjectIdentity")).toBe(true);
      }
    });

    it("rejects role with empty id", () => {
      const ws = createValidWorkspace();
      ws.roles[0].id = "";
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "EmptyRoleId")).toBe(true);
      }
    });

    it("rejects role with empty kind", () => {
      const ws = createValidWorkspace();
      ws.roles[0].kind = "";
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "EmptyRoleKind")).toBe(true);
      }
    });

    it("rejects role with empty subject identity", () => {
      const ws = createValidWorkspace();
      ws.roles[0].subject.identity = "";
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "MissingSubjectIdentity")).toBe(true);
      }
    });

    it("rejects role with no realizers", () => {
      const ws = createValidWorkspace();
      ws.roles[0].realizers = [];
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "MissingRoleRealizer")).toBe(true);
      }
    });

    it("rejects role with no witnesses", () => {
      const ws = createValidWorkspace();
      ws.roles[0].witnesses = [];
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "MissingRoleWitness")).toBe(true);
      }
    });

    it("rejects relation with missing source endpoint", () => {
      const ws = createValidWorkspace();
      ws.relations.push({
        tag: "Relation",
        kind: "Rel",
        source: "nonexistent",
        target: "role1",
      });
      const verdict = wellFormed(ws);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) {
        expect(verdict.errors.some(e => e.type === "MissingRelationEndpoint")).toBe(true);
      }
    });
  });

  describe("K3: Normalization", () => {
    it("sorts roles by id", () => {
      const ws = createValidWorkspace();
      ws.roles.push({
        tag: "Role",
        id: "aaa-role",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      // Unsorted
      expect(ws.roles[0].id).toBe("role1");
      expect(ws.roles[1].id).toBe("aaa-role");
      
      const normalized = normalize(ws);
      // Sorted
      expect(normalized.roles[0].id).toBe("aaa-role");
      expect(normalized.roles[1].id).toBe("role1");
    });

    it("sorts relations by tuple", () => {
      const ws = createValidWorkspace();
      ws.roles.push({
        tag: "Role",
        id: "role2",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      ws.relations.push(
        { tag: "Relation", kind: "ZRel", source: "role1", target: "role2" },
        { tag: "Relation", kind: "ARel", source: "role1", target: "role2" },
        { tag: "Relation", kind: "ARel", source: "role2", target: "role1" }
      );
      
      const normalized = normalize(ws);
      expect(normalized.relations[0].kind).toBe("ARel");
      expect(normalized.relations[0].source).toBe("role1");
      expect(normalized.relations[1].kind).toBe("ARel");
      expect(normalized.relations[1].source).toBe("role2");
      expect(normalized.relations[2].kind).toBe("ZRel");
    });

    it("sorts context entries", () => {
      const ws = createValidWorkspace();
      ws.context = new Map([
        ["z-key", "val1"],
        ["a-key", "val2"],
        ["m-key", "val3"],
      ]);
      
      const normalized = normalize(ws);
      const keys = Array.from(normalized.context.keys());
      expect(keys).toEqual(["a-key", "m-key", "z-key"]);
    });
  });

  describe("K4: Equivalence", () => {
    it("same workspaces are equivalent", () => {
      const ws1 = createValidWorkspace();
      const ws2 = createValidWorkspace();
      expect(equiv(ws1, ws2)).toBe(true);
    });

    it("different ids are not equivalent", () => {
      const ws1 = createValidWorkspace();
      const ws2 = createValidWorkspace();
      ws2.id = "different";
      expect(equiv(ws1, ws2)).toBe(false);
    });

    it("same roles in different order are equivalent", () => {
      const ws1 = createValidWorkspace();
      ws1.roles.push({
        tag: "Role",
        id: "aaa-role",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      
      const ws2 = createValidWorkspace();
      ws2.roles.unshift({
        tag: "Role",
        id: "aaa-role",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      
      expect(equiv(ws1, ws2)).toBe(true);
    });

    it("different context values are not equivalent", () => {
      const ws1 = createValidWorkspace();
      ws1.context.set("key", "val1");
      const ws2 = createValidWorkspace();
      ws2.context.set("key", "val2");
      expect(equiv(ws1, ws2)).toBe(false);
    });
  });

  describe("K5: Satisfaction", () => {
    it("satisfiedRole returns false for unknown role", () => {
      const ws = createValidWorkspace();
      const facts: Fact[] = [];
      const result = satisfiedRole(ws, facts, "unknown");
      expect(result.satisfied).toBe(false);
    });

    it("satisfiedRole requires subject observed", () => {
      const ws = createValidWorkspace();
      const facts: Fact[] = [
        { tag: "RoleRealized", roleId: "role1", realizerClass: "RealizerA" },
      ];
      const result = satisfiedRole(ws, facts, "role1");
      expect(result.satisfied).toBe(false);
      expect(result.reasons.some(r => r.includes("Subject"))).toBe(true);
    });

    it("satisfiedRole requires realizer observed", () => {
      const ws = createValidWorkspace();
      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "subj1" },
      ];
      const result = satisfiedRole(ws, facts, "role1");
      expect(result.satisfied).toBe(false);
      expect(result.reasons.some(r => r.includes("realizer"))).toBe(true);
    });

    it("satisfiedRole true when both subject and realizer observed", () => {
      const ws = createValidWorkspace();
      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "subj1" },
        { tag: "RoleRealized", roleId: "role1", realizerClass: "RealizerA" },
      ];
      const result = satisfiedRole(ws, facts, "role1");
      expect(result.satisfied).toBe(true);
    });

    it("satisfiedWorkspace requires all roles satisfied", () => {
      const ws = createValidWorkspace();
      ws.roles.push({
        tag: "Role",
        id: "role2",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      
      // Only satisfy role1
      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "subj1" },
        { tag: "RoleRealized", roleId: "role1", realizerClass: "RealizerA" },
      ];
      
      const result = satisfiedWorkspace(ws, facts);
      expect(result.satisfied).toBe(false);
    });

    it("satisfiedWorkspace requires all relations observed", () => {
      const ws = createValidWorkspace();
      ws.roles.push({
        tag: "Role",
        id: "role2",
        kind: "RoleKind",
        subject: {
          tag: "Subject",
          identity: "subj2",
          reference: "ref2",
        },
        realizers: [{ tag: "Realizer", class: "RealizerA", payload: "{}" }],
        witnesses: [{ tag: "Witness", class: "WitnessA", payload: "{}" }],
      });
      ws.relations.push({
        tag: "Relation",
        kind: "Depends",
        source: "role1",
        target: "role2",
      });
      
      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "subj1" },
        { tag: "SubjectObserved", subjectId: "subj2" },
        { tag: "RoleRealized", roleId: "role1", realizerClass: "RealizerA" },
        { tag: "RoleRealized", roleId: "role2", realizerClass: "RealizerA" },
      ];
      
      const result = satisfiedWorkspace(ws, facts);
      expect(result.satisfied).toBe(false);
      expect(result.reasons.some(r => r.includes("Relation"))).toBe(true);
    });

    it("satisfiedWorkspace true when all satisfied", () => {
      const ws = createValidWorkspace();
      
      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "subj1" },
        { tag: "RoleRealized", roleId: "role1", realizerClass: "RealizerA" },
      ];
      
      const result = satisfiedWorkspace(ws, facts);
      expect(result.satisfied).toBe(true);
    });
  });
});
