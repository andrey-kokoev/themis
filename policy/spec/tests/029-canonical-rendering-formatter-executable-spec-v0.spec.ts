import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import { render } from '../../../src/renderer/canonical-renderer.js';
import { workspacesEqual } from '../../../src/types/ast-equality.js';
import type { Workspace } from '../../../src/types/ast.js';

/**
 * Executable Spec: Canonical Rendering / Formatter Executable Spec v0
 * ID: j9q4lx
 * Lawbook Authority: 028-canonical-rendering-formatter-lawbook-v0
 * 
 * This spec operationalizes rendering laws R1-R5 for the minimal subset.
 */

describe('Canonical Rendering / Formatter Executable Spec v0', () => {
  describe('R1 - Uniqueness', () => {
    test('each AST has exactly one canonical form', () => {
      const input = `
        workspace "test" {
          context { "env" "dev" }
          persistence "session"
          equivalence "strict"
          role "admin" {
            kind "user"
            subject { identity "u1" reference "ref1" }
            realizer "R" "p1"
            witness "W" "d1"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical1 = render(ast);
      const canonical2 = render(ast);
      
      expect(canonical1).toBe(canonical2);
    });

    test('canonical form is independent of source formatting', () => {
      const messyInput = `workspace   "test"   {
  context{"b" "2" "a" "1"}
        persistence   "p"
  equivalence "e"
        role  "z"  {
          kind "k"
    subject{identity"i"reference"r"}
          realizer "C" "p"
          witness "W" "d"
        }
        role "a" { kind "k" subject { identity "i" reference "r" } realizer "C" "p" witness "W" "d" }
      }`;
      
      const ast = parse(messyInput);
      const canonical = render(ast);
      
      // Should be deterministically formatted
      expect(canonical).toContain('workspace "test" {');
      expect(canonical).toContain('  context {');
      expect(canonical).toContain('    "a" "1"');
      expect(canonical).toContain('    "b" "2"');
      // Roles should be sorted: "a" before "z"
      const aIndex = canonical.indexOf('role "a"');
      const zIndex = canonical.indexOf('role "z"');
      expect(aIndex).toBeLessThan(zIndex);
    });
  });

  describe('R2 - Idempotence', () => {
    test('render-parse-render stability', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast1 = parse(input);
      const canonical1 = render(ast1);
      
      const ast2 = parse(canonical1);
      const canonical2 = render(ast2);
      
      expect(canonical1).toBe(canonical2);
    });

    test('parsing canonical output produces renderable AST', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      const reparsed = parse(canonical);
      const recanonical = render(reparsed);
      
      expect(canonical).toBe(recanonical);
    });
  });

  describe('R3 - Ordering', () => {
    test('canonicalizes unordered roles', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "zebra" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
          role "alpha" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
          role "mike" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Roles should appear sorted: alpha, mike, zebra
      const alphaIdx = canonical.indexOf('role "alpha"');
      const mikeIdx = canonical.indexOf('role "mike"');
      const zebraIdx = canonical.indexOf('role "zebra"');
      
      expect(alphaIdx).toBeLessThan(mikeIdx);
      expect(mikeIdx).toBeLessThan(zebraIdx);
    });

    test('canonicalizes unordered context entries', () => {
      const input = `
        workspace "test" {
          context {
            "zebra" "z"
            "alpha" "a"
            "mike" "m"
          }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Context entries should be sorted: alpha, mike, zebra
      const alphaIdx = canonical.indexOf('"alpha" "a"');
      const mikeIdx = canonical.indexOf('"mike" "m"');
      const zebraIdx = canonical.indexOf('"zebra" "z"');
      
      expect(alphaIdx).toBeLessThan(mikeIdx);
      expect(mikeIdx).toBeLessThan(zebraIdx);
    });

    test('canonicalizes relation ordering', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
          relation "uses" "z" "a"
          relation "depends" "a" "b"
          relation "uses" "a" "z"
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Relations sorted by (kind, source, target):
      // depends a b
      // uses a z
      // uses z a
      const dependsIdx = canonical.indexOf('relation "depends"');
      const usesAZIdx = canonical.indexOf('relation "uses" "a"');
      const usesZAIdx = canonical.indexOf('relation "uses" "z"');
      
      expect(dependsIdx).toBeLessThan(usesAZIdx);
      expect(usesAZIdx).toBeLessThan(usesZAIdx);
    });

    test('preserves realizer/witness order', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "First" "1"
            realizer "Second" "2"
            realizer "Third" "3"
            witness "Alpha" "a"
            witness "Beta" "b"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Realizers should maintain source order
      const r1 = canonical.indexOf('realizer "First"');
      const r2 = canonical.indexOf('realizer "Second"');
      const r3 = canonical.indexOf('realizer "Third"');
      expect(r1).toBeLessThan(r2);
      expect(r2).toBeLessThan(r3);
      
      // Witnesses should maintain source order
      const w1 = canonical.indexOf('witness "Alpha"');
      const w2 = canonical.indexOf('witness "Beta"');
      expect(w1).toBeLessThan(w2);
    });
  });

  describe('R4 - Stability', () => {
    test('deterministic output for same AST', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const results = new Set<string>();
      
      // Render multiple times
      for (let i = 0; i < 5; i++) {
        results.add(render(ast));
      }
      
      // All should be identical
      expect(results.size).toBe(1);
    });
  });

  describe('R5 - Losslessness', () => {
    test('round-trip: parse -> render -> parse equality', () => {
      const input = `
        workspace "test" {
          context { "env" "prod" "region" "us-east" }
          persistence "durable"
          equivalence "strict"
          role "web" {
            kind "service"
            subject { identity "svc-web" reference "ref-web" locator "https://example.com" }
            realizer "Docker" "nginx:latest"
            realizer "K8s" "deployment.yaml"
            witness "HealthCheck" "http://localhost/health"
            witness "Metrics" "prometheus:9090"
          }
          role "db" {
            kind "database"
            subject { identity "svc-db" reference "ref-db" }
            realizer "RDS" "postgres:15"
            witness "Backup" "daily"
          }
          relation "depends" "web" "db"
          relation "uses" "web" "cache"
        }
      `;
      
      const ast1 = parse(input);
      const canonical = render(ast1);
      const ast2 = parse(canonical);
      
      // ASTs should be semantically equal
      expect(workspacesEqual(ast1, ast2)).toBe(true);
    });
  });

  describe('Formatting Rules', () => {
    test('uses 2-space indentation', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      const lines = canonical.split('\n');
      
      // Check indentation levels
      const workspaceLine = lines.find(l => l.includes('workspace'));
      const contextLine = lines.find(l => l.includes('context {'));
      const entryLine = lines.find(l => l.includes('"k" "v"'));
      
      expect(workspaceLine?.startsWith('workspace')).toBe(true);
      expect(contextLine?.startsWith('  context')).toBe(true);
      expect(entryLine?.startsWith('    "k"')).toBe(true);
    });

    test('no trailing whitespace', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // No line should end with whitespace
      const lines = canonical.split('\n');
      for (const line of lines) {
        expect(line).toBe(line.trimEnd());
      }
    });

    test('blank lines between major blocks', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r1" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
          role "r2" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Should have blank line after equivalence and between roles
      expect(canonical).toContain('equivalence "e"\n\n  role');
      expect(canonical).toContain('}\n\n  role "r2"');
    });
  });

  describe('Workspace Structure Ordering', () => {
    test('enforces correct workspace section order', () => {
      // Input with items in wrong conceptual order (parser accepts any order)
      const input = `
        workspace "test" {
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
          context { "k" "v" }
          equivalence "e"
          persistence "p"
        }
      `;
      
      const ast = parse(input);
      const canonical = render(ast);
      
      // Canonical should reorder: context, persistence, equivalence, role
      const contextIdx = canonical.indexOf('context {');
      const persistenceIdx = canonical.indexOf('persistence');
      const equivalenceIdx = canonical.indexOf('equivalence');
      const roleIdx = canonical.indexOf('role');
      
      expect(contextIdx).toBeLessThan(persistenceIdx);
      expect(persistenceIdx).toBeLessThan(equivalenceIdx);
      expect(equivalenceIdx).toBeLessThan(roleIdx);
    });
  });
});
