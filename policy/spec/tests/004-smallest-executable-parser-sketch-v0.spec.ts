import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import {
  UnexpectedToken,
  UnexpectedEOF,
  MissingRequiredClause,
  InvalidNesting,
  TrailingRootContent,
} from '../../../src/types/errors.js';

/**
 * Executable Spec: Smallest Executable Parser Sketch v0
 * ID: c1p8ru
 * Lawbook Authority: 002-minimal-parser-contract-v0
 * 
 * This spec operationalizes the parser laws P1-P5 for the minimal subset.
 */

describe('Smallest Executable Parser Sketch v0', () => {
  describe('P1 - Root Laws', () => {
    test('parses minimal valid workspace', () => {
      const input = `
        workspace "test" {
          context {
            "env" "dev"
          }
          persistence "session"
          equivalence "strict"
          role "admin" {
            kind "user"
            subject {
              identity "user-1"
              reference "ref-1"
            }
            realizer "ClassA" "payload1"
            witness "WitnessX" "data1"
          }
        }
      `;
      
      const result = parse(input);
      expect(result.tag).toBe('Workspace');
      expect(result.name).toBe('test');
      expect(result.items.length).toBe(4); // context, persistence, equivalence, role
    });

    test('rejects second root after complete workspace', () => {
      const input = `
        workspace "first" {
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
        workspace "second" {
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
      
      expect(() => parse(input)).toThrow(TrailingRootContent);
    });

    test('rejects workspace keyword without name', () => {
      const input = `workspace { context { "k" "v" } persistence "p" equivalence "e" role "r" { kind "k" subject { identity "i" reference "r" } realizer "C" "p" witness "W" "d" } }`;
      expect(() => parse(input)).toThrow(UnexpectedToken);
    });
  });

  describe('P2 - Block Structure Laws', () => {
    test('rejects role-local clauses at workspace level', () => {
      const input = `
        workspace "test" {
          kind "invalid"
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
      expect(() => parse(input)).toThrow(InvalidNesting);
    });

    test('rejects subject block outside role', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          subject { identity "i" reference "r" }
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      expect(() => parse(input)).toThrow(InvalidNesting);
    });

    test('rejects context inside role', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            context { "bad" "here" }
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      expect(() => parse(input)).toThrow(InvalidNesting);
    });
  });

  describe('P3 - Required Clause Laws', () => {
    test('rejects missing role kind', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            subject { identity "i" reference "r" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });

    test('rejects missing subject reference', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });

    test('rejects missing realizer', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            witness "W" "d"
          }
        }
      `;
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });

    test('rejects missing witness', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject { identity "i" reference "r" }
            realizer "C" "p"
          }
        }
      `;
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });

    test('rejects missing workspace context', () => {
      const input = `
        workspace "test" {
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
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });
  });

  describe('P4 - Determinism Laws', () => {
    test('is deterministic for same valid input', () => {
      const input = `
        workspace "det" {
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
      
      const result1 = parse(input);
      const result2 = parse(input);
      expect(result1).toEqual(result2);
    });

    test('produces same error class for same invalid input', () => {
      const input = `workspace "x" { persistence "p" equivalence "e" role "r" { kind "k" subject { identity "i" reference "r" } realizer "C" "p" witness "W" "d" } }`;
      
      // Missing context - should always throw MissingRequiredClause
      expect(() => parse(input)).toThrow(MissingRequiredClause);
      expect(() => parse(input)).toThrow(MissingRequiredClause);
    });
  });

  describe('P5 - Delimiter and EOF Laws', () => {
    test('rejects missing closing brace', () => {
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
      `;
      expect(() => parse(input)).toThrow(UnexpectedEOF);
    });

    test('rejects extra trailing root content', () => {
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
        extra
      `;
      expect(() => parse(input)).toThrow(TrailingRootContent);
    });
  });

  describe('Optional Features', () => {
    test('accepts optional subject locator', () => {
      const input = `
        workspace "test" {
          context { "k" "v" }
          persistence "p"
          equivalence "e"
          role "r" {
            kind "k"
            subject {
              identity "i"
              reference "r"
              locator "loc"
            }
            realizer "C" "p"
            witness "W" "d"
          }
        }
      `;
      const result = parse(input);
      const role = result.items.find(i => i.tag === 'RoleBlock') as any;
      expect(role.subject.locator).toBe('loc');
    });

    test('accepts multiple relations', () => {
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
          relation "depends" "a" "b"
          relation "uses" "c" "d"
        }
      `;
      const result = parse(input);
      const relations = result.items.filter(i => i.tag === 'RelationBlock');
      expect(relations.length).toBe(2);
    });
  });
});
