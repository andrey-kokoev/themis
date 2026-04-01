import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import { integrate } from '../../../src/runtime/integration.js';
import {
  createJournal,
  append,
  replay,
  hashWorkspace,
} from '../../../src/runtime/journal.js';
import type { Workspace } from '../../../src/types/ast.js';
import type { Fact, IntegrationVerdict } from '../../../src/types/runtime-integration.js';
import type { Journal, JournalInput } from '../../../src/types/journal.js';

/**
 * Executable Spec: Operator State / Durable Runtime Journal Executable Spec v0
 * ID: y7c2lm
 * Lawbook Authority: 034-operator-state-durable-runtime-journal-lawbook-v0
 * 
 * This spec operationalizes journal laws J1-J5.
 */

function createWorkspace(source: string): Workspace {
  return parse(source);
}

function createFacts(roleId: string, subjectId: string): Fact[] {
  return [
    { tag: "SubjectObserved", subjectId },
    { tag: "RoleRealized", roleId, realizerClass: "Docker", payload: "test" },
  ];
}

describe('Operator State / Durable Runtime Journal Executable Spec v0', () => {
  describe('J1 - Append-Only', () => {
    test('append creates first record with seq=1', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      
      expect(journal.records).toHaveLength(1);
      expect(journal.records[0].seq).toBe(1);
      expect(journal.nextSeq).toBe(2);
    });

    test('append increments seq deterministically', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      
      expect(journal.records).toHaveLength(3);
      expect(journal.records[0].seq).toBe(1);
      expect(journal.records[1].seq).toBe(2);
      expect(journal.records[2].seq).toBe(3);
      expect(journal.nextSeq).toBe(4);
    });

    test('append does not mutate previous records', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict1 = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict: verdict1 });
      
      const firstRecord = journal.records[0];
      
      // Append more
      const verdict2 = integrate({ workspace, facts });
      journal = append(journal, { workspace, facts, verdict: verdict2 });
      
      // First record should be unchanged
      expect(journal.records[0]).toBe(firstRecord);
      expect(journal.records[0].seq).toBe(1);
    });
  });

  describe('J2 - Sequencing', () => {
    test('logical time increases with seq', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      
      // at should equal seq (our implementation choice)
      expect(journal.records[0].at).toBe(1);
      expect(journal.records[1].at).toBe(2);
      expect(journal.records[2].at).toBe(3);
      
      // Strictly increasing
      expect(journal.records[1].at).toBeGreaterThan(journal.records[0].at);
      expect(journal.records[2].at).toBeGreaterThan(journal.records[1].at);
    });
  });

  describe('J3 - Identity', () => {
    test('same workspace yields same hash across records', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      
      expect(journal.records[0].workspaceHash).toBe(journal.records[1].workspaceHash);
    });

    test('different workspace yields different hash', () => {
      const workspace1 = createWorkspace(`
        workspace "test1" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const workspace2 = createWorkspace(`
        workspace "test2" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      
      const hash1 = hashWorkspace(workspace1);
      const hash2 = hashWorkspace(workspace2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('J4 - Replay Correctness', () => {
    test('replay succeeds for valid journal', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      
      const result = replay(journal, (hash) => workspace);
      expect(result.ok).toBe(true);
      expect(result.firstFailureSeq).toBeUndefined();
    });

    test('replay detects tampered verdict', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const correctVerdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict: correctVerdict });
      
      // Tamper the verdict in the record
      journal.records[0].verdict = {
        ...correctVerdict,
        admissible: !correctVerdict.admissible, // Flip admissibility
      };
      
      const result = replay(journal, (hash) => workspace);
      expect(result.ok).toBe(false);
      expect(result.firstFailureSeq).toBe(1);
    });

    test('replay detects mismatch if integration logic changes', () => {
      // This test simulates what would happen if integration logic changed
      // by manually creating a record with a verdict that wouldn't be produced
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const correctVerdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict: correctVerdict });
      
      // Create a different workspace that would produce different verdict
      const differentWorkspace = createWorkspace(`
        workspace "different" {
          context { "env" "dev" }
          persistence "ephemeral"
          equivalence "lenient"
          role "other" {
            kind "service"
            subject { identity "other" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      
      // Replay with wrong workspace resolver
      const result = replay(journal, (hash) => differentWorkspace);
      expect(result.ok).toBe(false);
    });
  });

  describe('J5 - Non-Authority', () => {
    test('duplicate (workspace,facts) produces distinct records with same verdict', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      journal = append(journal, { workspace, facts, verdict });
      
      // Distinct records
      expect(journal.records[0].seq).not.toBe(journal.records[1].seq);
      expect(journal.records[0].at).not.toBe(journal.records[1].at);
      
      // Same workspace hash
      expect(journal.records[0].workspaceHash).toBe(journal.records[1].workspaceHash);
      
      // Same verdict
      expect(journal.records[0].verdict.admissible).toBe(journal.records[1].verdict.admissible);
    });
  });

  describe('Journal Operations', () => {
    test('journal starts empty', () => {
      const journal = createJournal();
      expect(journal.records).toHaveLength(0);
      expect(journal.nextSeq).toBe(1);
    });

    test('hashWorkspace is deterministic', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      
      const hash1 = hashWorkspace(workspace);
      const hash2 = hashWorkspace(workspace);
      
      expect(hash1).toBe(hash2);
    });

    test('replay fails when workspace not found', () => {
      const workspace = createWorkspace(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "svc" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);
      const facts = createFacts("app", "svc");
      const verdict = integrate({ workspace, facts });
      
      let journal = createJournal();
      journal = append(journal, { workspace, facts, verdict });
      
      // Resolver returns undefined
      const result = replay(journal, (hash) => undefined);
      expect(result.ok).toBe(false);
      expect(result.firstFailureSeq).toBe(1);
    });
  });
});
