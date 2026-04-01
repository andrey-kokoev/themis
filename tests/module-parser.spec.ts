/**
 * Module Parser Tests
 * 
 * Tests for Task 017: Module / Import Surface Syntax
 * Covers M1-M5 law families.
 */

import { describe, it, expect } from "vitest";
import { parseModule, lowerModule, ModuleParseError, MultipleModuleRootsError, MissingWorkspaceError, InvalidPlacementError } from "../src/parser/module-parser.js";

describe("Module Parser (M1-M5)", () => {
  describe("M1: Module Root Laws", () => {
    it("parses minimal module with workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        }
      `;

      const result = parseModule(input);
      expect(result.tag).toBe("Module");
      expect(result.moduleId).toBe("test-mod");
      expect(result.workspace.name).toBe("test-ws");
    });

    it("rejects file with zero modules", () => {
      const input = `
        // Just a comment
      `;
      expect(() => parseModule(input)).toThrow(ModuleParseError);
    });

    it("rejects file with two module roots", () => {
      const input = `
        module "mod1" {
          workspace "ws1" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
        module "mod2" {
          workspace "ws2" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r2" {
              kind "k"
              subject { identity "s2" reference "ref2" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(MultipleModuleRootsError);
    });

    it("rejects module without workspace", () => {
      const input = `
        module "test-mod" {
          import "other-mod"
        }
      `;
      expect(() => parseModule(input)).toThrow(MissingWorkspaceError);
    });

    it("rejects module with multiple workspaces", () => {
      const input = `
        module "test-mod" {
          workspace "ws1" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
          workspace "ws2" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r2" {
              kind "k"
              subject { identity "s2" reference "ref2" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(MissingWorkspaceError);
    });
  });

  describe("M2: Import Laws", () => {
    it("parses import declarations", () => {
      const input = `
        module "test-mod" {
          import "mod-a"
          import "mod-b"
          import "mod-c"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result = parseModule(input);
      expect(result.imports).toHaveLength(3);
      expect(result.imports[0].moduleId).toBe("mod-a");
      expect(result.imports[1].moduleId).toBe("mod-b");
      expect(result.imports[2].moduleId).toBe("mod-c");
    });

    it("rejects import inside workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            import "other-mod"
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(InvalidPlacementError);
    });

    it("rejects import after workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
          import "other-mod"
        }
      `;
      expect(() => parseModule(input)).toThrow(InvalidPlacementError);
    });
  });

  describe("M3: Explicit Composition Declaration Laws", () => {
    it("parses namespace declaration and lowers correctly", () => {
      const input = `
        module "test-mod" {
          namespace "mod-a" as "nsA"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result = parseModule(input);
      expect(result.namespaces).toHaveLength(1);
      expect(result.namespaces[0].moduleId).toBe("mod-a");
      expect(result.namespaces[0].namespace).toBe("nsA");

      // Verify lowering
      const lowered = lowerModule(result);
      expect(lowered.policy.namespaces).toHaveLength(1);
      expect(lowered.policy.namespaces[0].moduleId).toBe("mod-a");
      expect(lowered.policy.namespaces[0].namespace).toBe("nsA");
    });

    it("parses alias declaration and lowers correctly", () => {
      const input = `
        module "test-mod" {
          alias role "mod-a"."r1" as "composed-r1"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result = parseModule(input);
      expect(result.aliases).toHaveLength(1);
      expect(result.aliases[0].moduleId).toBe("mod-a");
      expect(result.aliases[0].localRoleId).toBe("r1");
      expect(result.aliases[0].composedRoleId).toBe("composed-r1");

      // Verify lowering
      const lowered = lowerModule(result);
      expect(lowered.policy.aliases).toHaveLength(1);
      expect(lowered.policy.aliases[0].moduleId).toBe("mod-a");
      expect(lowered.policy.aliases[0].localRoleId).toBe("r1");
      expect(lowered.policy.aliases[0].composedRoleId).toBe("composed-r1");
    });

    it("parses shared subject declaration and lowers correctly", () => {
      const input = `
        module "test-mod" {
          share subject "shared-s1" across "mod-a", "mod-b"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result = parseModule(input);
      expect(result.sharedIdentities).toHaveLength(1);
      expect(result.sharedIdentities[0].subjectId).toBe("shared-s1");
      expect(result.sharedIdentities[0].modules).toEqual(["mod-a", "mod-b"]);

      // Verify lowering
      const lowered = lowerModule(result);
      expect(lowered.policy.sharedIdentities).toHaveLength(1);
      expect(lowered.policy.sharedIdentities[0].subjectId).toBe("shared-s1");
      expect(lowered.policy.sharedIdentities[0].modules).toEqual(["mod-a", "mod-b"]);
    });
  });

  describe("M4: Placement Laws", () => {
    it("rejects namespace declaration inside workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            namespace "mod-a" as "nsA"
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(InvalidPlacementError);
    });

    it("rejects alias declaration inside workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            alias role "mod-a"."r1" as "composed-r1"
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(InvalidPlacementError);
    });

    it("rejects shared identity declaration inside workspace", () => {
      const input = `
        module "test-mod" {
          workspace "test-ws" {
            share subject "s1" across "mod-a", "mod-b"
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;
      expect(() => parseModule(input)).toThrow(InvalidPlacementError);
    });
  });

  describe("M5: Lowering Laws", () => {
    it("module lower result is deterministic", () => {
      const input = `
        module "test-mod" {
          import "mod-a"
          import "mod-b"
          namespace "mod-a" as "nsA"
          alias role "mod-a"."r1" as "composed-r1"
          share subject "s1" across "mod-a", "mod-b"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result1 = lowerModule(parseModule(input));
      const result2 = lowerModule(parseModule(input));

      // Should be identical
      expect(result1).toEqual(result2);
    });

    it("canonical surface order enforced in parsing", () => {
      // Even if declarations appear in non-canonical order, they get categorized correctly
      const input = `
        module "test-mod" {
          namespace "mod-a" as "nsA"
          import "mod-a"
          alias role "mod-a"."r1" as "composed-r1"
          share subject "s1" across "mod-a", "mod-b"
          workspace "test-ws" {
            context { "k" "v" }
            persistence "p"
            equivalence "e"
            role "r1" {
              kind "k"
              subject { identity "s1" reference "ref1" }
              realizer "R" "p"
              witness "W" "d"
            }
          }
        }
      `;

      const result = parseModule(input);
      // Imports come first in the AST regardless of parse order
      expect(result.imports).toHaveLength(1);
      expect(result.namespaces).toHaveLength(1);
      expect(result.aliases).toHaveLength(1);
      expect(result.sharedIdentities).toHaveLength(1);
    });
  });
});
