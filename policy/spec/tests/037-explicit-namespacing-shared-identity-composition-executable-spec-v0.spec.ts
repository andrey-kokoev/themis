import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import { composeExplicit } from '../../../src/composition/explicit-composition.js';
import type { Module, ExplicitCompositionPolicy } from '../../../src/types/explicit-composition.js';

/**
 * Executable Spec: Explicit Namespacing / Shared-Identity Composition Executable Spec v0
 * ID: u4k9sb
 * Lawbook Authority: 036-explicit-namespacing-shared-identity-composition-lawbook-v0
 * 
 * This spec operationalizes explicit composition laws E1-E5.
 */

function createModule(moduleId: string, source: string): Module {
  return {
    moduleId,
    workspace: parse(source),
  };
}

describe('Explicit Namespacing / Shared-Identity Composition Executable Spec v0', () => {
  describe('E1 - Namespace Laws', () => {
    test('explicit namespaces allow same local role id without collision', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "same-role" {
            kind "service"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "same-role" {
            kind "service"
            subject { identity "id-b" reference "ref-b" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(true);
      
      // Should have both roles with namespaced ids
      const roles = result.composed?.items.filter(i => i.tag === 'RoleBlock') as any[];
      expect(roles.length).toBe(2);
      expect(roles.some(r => r.roleId === 'nsA::same-role')).toBe(true);
      expect(roles.some(r => r.roleId === 'nsB::same-role')).toBe(true);
    });

    test('same namespace used by two modules fails', () => {
      const modA = createModule('mod-a', `
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

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
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

      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'shared-ns' },
          { moduleId: 'mod-b', namespace: 'shared-ns' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'NamespaceCollision')).toBe(true);
    });
  });

  describe('E2 - Alias Laws', () => {
    test('lifting rule follows alias > namespace > raw', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "local-role" {
            kind "service"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      // Test 1: With alias, use alias target
      const policyWithAlias: ExplicitCompositionPolicy = {
        namespaces: [{ moduleId: 'mod-a', namespace: 'nsA' }],
        aliases: [{ moduleId: 'mod-a', localRoleId: 'local-role', composedRoleId: 'custom-name' }],
      };

      const result1 = composeExplicit([modA], policyWithAlias);
      expect(result1.admissible).toBe(true);
      const roles1 = result1.composed?.items.filter(i => i.tag === 'RoleBlock') as any[];
      expect(roles1[0].roleId).toBe('custom-name'); // Alias wins

      // Test 2: No alias, use namespace
      const policyNoAlias: ExplicitCompositionPolicy = {
        namespaces: [{ moduleId: 'mod-a', namespace: 'nsA' }],
      };

      const result2 = composeExplicit([modA], policyNoAlias);
      expect(result2.admissible).toBe(true);
      const roles2 = result2.composed?.items.filter(i => i.tag === 'RoleBlock') as any[];
      expect(roles2[0].roleId).toBe('nsA::local-role'); // Namespace wins

      // Test 3: No alias, no namespace, use raw
      const policyRaw: ExplicitCompositionPolicy = {};

      const result3 = composeExplicit([modA], policyRaw);
      expect(result3.admissible).toBe(true);
      const roles3 = result3.composed?.items.filter(i => i.tag === 'RoleBlock') as any[];
      expect(roles3[0].roleId).toBe('local-role'); // Raw wins
    });

    test('alias collision on same composed role id fails', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "role-a" {
            kind "k"
            subject { identity "i1" reference "r1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "role-b" {
            kind "k"
            subject { identity "i2" reference "r2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      // Both aliases target the same composed id
      const policy: ExplicitCompositionPolicy = {
        aliases: [
          { moduleId: 'mod-a', localRoleId: 'role-a', composedRoleId: 'same-target' },
          { moduleId: 'mod-b', localRoleId: 'role-b', composedRoleId: 'same-target' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'AliasCollision')).toBe(true);
    });
  });

  describe('E3 - Shared-Identity Laws', () => {
    test('shared subject identity without declaration fails', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "shared-subject" reference "ref1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "shared-subject" reference "ref2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      // No shared identity declaration
      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'UndeclaredSharedIdentity')).toBe(true);
    });

    test('shared subject identity fails kernel well-formedness', () => {
      // KERNEL ALIGNMENT: Shared identities produce duplicate subject identities,
      // which violates kernel law K2 (DuplicateSubjectIdentity).
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "shared-subject" reference "ref1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "shared-subject" reference "ref2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      // Exact declaration matching both modules
      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
        sharedIdentities: [
          { subjectId: 'shared-subject', modules: ['mod-a', 'mod-b'] },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      // Kernel-aligned: shared identities produce invalid workspace
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'KernelWellFormednessFailure')).toBe(true);
    });

    test('invalid shared identity declaration fails', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "shared-subject" reference "ref1" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "shared-subject" reference "ref2" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modC = createModule('mod-c', `
        workspace "ws-c" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r3" {
            kind "k"
            subject { identity "shared-subject" reference "ref3" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      // Declaration doesn't include mod-c
      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
          { moduleId: 'mod-c', namespace: 'nsC' },
        ],
        sharedIdentities: [
          { subjectId: 'shared-subject', modules: ['mod-a', 'mod-b'] }, // Missing mod-c
        ],
      };

      const result = composeExplicit([modA, modB, modC], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'InvalidSharedIdentityDecl')).toBe(true);
    });
  });

  describe('E4 - Relation Resolution Laws', () => {
    test('relation endpoints resolve after lifting', () => {
      // modA has a relation between its own roles (intra-module relation)
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "frontend" {
            kind "service"
            subject { identity "id-fe" reference "ref-fe" }
            realizer "R" "p"
            witness "W" "d"
          }
          role "backend" {
            kind "service"
            subject { identity "id-be" reference "ref-be" }
            realizer "R" "p"
            witness "W" "d"
          }
          relation "uses" "frontend" "backend"
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "database" {
            kind "service"
            subject { identity "id-db" reference "ref-db" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(true);

      // Relations should use lifted ids - intra-module relations get lifted consistently
      const relations = result.composed?.items.filter(i => i.tag === 'RelationBlock') as any[];
      expect(relations.length).toBe(1);
      // Both endpoints should be namespaced to nsA since the relation is in modA
      expect(relations[0].source).toBe('nsA::frontend');
      expect(relations[0].target).toBe('nsA::backend');
    });

    test('ambiguous relation endpoint after lifting fails', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "target" {
            kind "k"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "target" {
            kind "k"
            subject { identity "id-b" reference "ref-b" }
            realizer "R" "p"
            witness "W" "d"
          }
          relation "uses" "target" "target"
        }
      `);

      // No namespaces or aliases - both roles will have same id "target"
      const policy: ExplicitCompositionPolicy = {};

      const result = composeExplicit([modA, modB], policy);
      // Should fail due to alias collision (both roles get same lifted id)
      expect(result.admissible).toBe(false);
    });
  });

  describe('E5 - Strictness Preservation', () => {
    test('persistence disagreement still fails under explicit policy', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "durable"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "ephemeral"
          equivalence "e"
          role "r2" {
            kind "k"
            subject { identity "id-b" reference "ref-b" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'PersistenceModeConflict')).toBe(true);
    });

    test('equivalence disagreement still fails under explicit policy', () => {
      const modA = createModule('mod-a', `
        workspace "ws-a" {
          context { "k" "v" }
          persistence "p"
          equivalence "strict"
          role "r1" {
            kind "k"
            subject { identity "id-a" reference "ref-a" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const modB = createModule('mod-b', `
        workspace "ws-b" {
          context { "k" "v" }
          persistence "p"
          equivalence "lenient"
          role "r2" {
            kind "k"
            subject { identity "id-b" reference "ref-b" }
            realizer "R" "p"
            witness "W" "d"
          }
        }
      `);

      const policy: ExplicitCompositionPolicy = {
        namespaces: [
          { moduleId: 'mod-a', namespace: 'nsA' },
          { moduleId: 'mod-b', namespace: 'nsB' },
        ],
      };

      const result = composeExplicit([modA, modB], policy);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === 'EquivalenceConflict')).toBe(true);
    });
  });
});
