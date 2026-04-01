import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import { compose } from '../../../src/composition/conservative-composition.js';
import type { Module } from '../../../src/types/composition.js';

/**
 * Executable Spec: Multi-Workspace / Module Composition Executable Spec v0
 * ID: d3p9wx
 * Lawbook Authority: 030-multi-workspace-module-composition-lawbook-v0
 * 
 * This spec operationalizes composition laws C1-C5.
 */

function createModule(moduleId: string, source: string): Module {
  return {
    moduleId,
    workspace: parse(source),
  };
}

describe('Multi-Workspace / Module Composition Executable Spec v0', () => {
  describe('C1 - Canonical Ordering', () => {
    test('canonical module order ignores input order', () => {
      const moduleA = createModule('alpha', `
        workspace "ws-alpha" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "role-a" {
            kind "service"
            subject { identity "svc-a" reference "ref-a" }
            realizer "Docker" "image-a"
            witness "Health" "ok"
          }
        }
      `);

      const moduleZ = createModule('zebra', `
        workspace "ws-zebra" {
          context { "region" "us-east" }
          persistence "durable"
          equivalence "strict"
          role "role-z" {
            kind "service"
            subject { identity "svc-z" reference "ref-z" }
            realizer "Docker" "image-z"
            witness "Health" "ok"
          }
        }
      `);

      // Compose in different orders
      const result1 = compose([moduleA, moduleZ]);
      const result2 = compose([moduleZ, moduleA]);

      expect(result1.admissible).toBe(true);
      expect(result2.admissible).toBe(true);
      
      // Both should produce same composed id (alpha+zebra, sorted)
      expect(result1.composed?.name).toBe('alpha+zebra');
      expect(result2.composed?.name).toBe('alpha+zebra');
      
      // Results should be identical
      expect(result1.composed).toEqual(result2.composed);
    });

    test('successful composition produces sorted outputs', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "z-key" "z-val" "a-key" "a-val" }
          persistence "durable"
          equivalence "strict"
          role "zebra" {
            kind "service"
            subject { identity "id-z" reference "ref-z" }
            realizer "R" "p"
            witness "W" "d"
          }
          role "alpha" {
            kind "service"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "m-key" "m-val" }
          persistence "durable"
          equivalence "strict"
          role "mike" {
            kind "service"
            subject { identity "id-m" reference "ref-m" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(true);

      // Roles should be sorted: alpha, mike, zebra
      const roles = result.composed?.items.filter(i => i.tag === 'RoleBlock') as any[];
      expect(roles[0].roleId).toBe('alpha');
      expect(roles[1].roleId).toBe('mike');
      expect(roles[2].roleId).toBe('zebra');

      // Context should be sorted: a-key, m-key, z-key
      const contexts = result.composed?.items.filter(i => i.tag === 'ContextBlock') as any[];
      const entries = contexts[0].entries;
      expect(entries[0].key).toBe('a-key');
      expect(entries[1].key).toBe('m-key');
      expect(entries[2].key).toBe('z-key');
    });
  });

  describe('C2 - Collision Failure', () => {
    test('workspace id collision fails', () => {
      const mod1 = createModule('mod1', `
        workspace "same-id" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "same-id" {
          context { "k2" "v2" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'WorkspaceIdCollision')).toBe(true);
    });

    test('role id collision fails', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "same-role" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "same-role" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'RoleIdCollision')).toBe(true);
    });

    test('subject identity collision fails', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "same-subject" reference "ref1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "same-subject" reference "ref2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'SubjectCollision')).toBe(true);
    });
  });

  describe('C3 - Agreement Rules', () => {
    test('persistence disagreement fails', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "k" "v" }
          persistence "durable"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "k" "v" }
          persistence "ephemeral"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'PersistenceModeConflict')).toBe(true);
    });

    test('equivalence disagreement fails', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "k" "v" }
          persistence "p"
          equivalence "strict"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "k" "v" }
          persistence "p"
          equivalence "lenient"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'EquivalenceConflict')).toBe(true);
    });
  });

  describe('C4 - Relation Resolution', () => {
    test('missing relation endpoint fails', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "existing-role" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
          relation "uses" "missing-role" "existing-role"
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'RelationEndpointMissing')).toBe(true);
    });
  });

  describe('Context Handling', () => {
    test('equal context values dedup', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "shared-key" "same-value" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "shared-key" "same-value" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(true);
      
      const contexts = result.composed?.items.filter(i => i.tag === 'ContextBlock') as any[];
      const entries = contexts[0].entries;
      
      // Should have only one entry for shared-key
      expect(entries.filter((e: any) => e.key === 'shared-key').length).toBe(1);
    });

    test('unequal context values fail', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "shared-key" "value-a" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "shared-key" "value-b" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'ContextKeyCollision')).toBe(true);
    });
  });

  describe('C5 - Success Shape', () => {
    test('successful composition produces deterministic workspace id', () => {
      const modA = createModule('aaa', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('bbb', `
        workspace "ws-b" {
          context { "k2" "v2" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const result = compose([modA, modB]);
      expect(result.admissible).toBe(true);
      
      // IDs sorted lexicographically: aaa+bbb
      expect(result.composed?.name).toBe('aaa+bbb');
      expect(result.notes?.some(n => n.includes('2 modules'))).toBe(true);
    });

    test('successful composition aggregates all items', () => {
      const mod1 = createModule('mod1', `
        workspace "ws1" {
          context { "key1" "val1" }
          persistence "durable"
          equivalence "strict"
          role "role-1" {
            kind "service"
            subject { identity "id-1" reference "ref-1" }
            realizer "R1" "p1"
            witness "W1" "d1"
          }
          relation "uses" "role-1" "role-2"
        }
      `);

      const mod2 = createModule('mod2', `
        workspace "ws2" {
          context { "key2" "val2" }
          persistence "durable"
          equivalence "strict"
          role "role-2" {
            kind "service"
            subject { identity "id-2" reference "ref-2" }
            realizer "R2" "p2"
            witness "W2" "d2"
          }
        }
      `);

      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(true);

      const roles = result.composed?.items.filter(i => i.tag === 'RoleBlock');
      const relations = result.composed?.items.filter(i => i.tag === 'RelationBlock');

      expect(roles?.length).toBe(2);
      expect(relations?.length).toBe(1);
    });
  });
});
