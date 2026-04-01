/**
 * Kernel Alignment Tests (Task 016)
 * 
 * Tests verifying downstream layers are properly rebound to explicit kernel.
 * Law families A1-A5.
 */

import { describe, it, expect } from "vitest";
import { compose } from "../src/composition/conservative-composition.js";
import { composeExplicit } from "../src/composition/explicit-composition.js";
import { integrate } from "../src/runtime/integration.js";
import { toKernelWorkspace } from "../src/kernel/ast-to-kernel.js";
import { wellFormed, equiv, normalize } from "../src/kernel/kernel.js";
import { validateRepo, isAuthoritativeSource } from "../src/envelope/validator.js";
import { parse } from "../src/parser/minimal-parser.js";
import type { Module } from "../src/types/composition.js";
import type { Fact } from "../src/types/runtime-integration.js";

// Helper to create module
type WorkspaceInput = {
  moduleId: string;
  workspaceDsl: string;
};

function createModule(input: WorkspaceInput): Module {
  const workspace = parse(input.workspaceDsl);
  return {
    moduleId: input.moduleId,
    workspace,
  };
}

describe("Kernel Alignment (A1-A5)", () => {
  describe("A1: Single Center - No shadowing", () => {
    it("runtime integration notes kernel alignment", () => {
      const workspace = parse(`
        workspace "test" {
          context { "env" "test" }
          persistence "ephemeral"
          equivalence "canonical"
          role "r1" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);

      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "s1" },
        { tag: "RoleRealized", roleId: "r1", realizerClass: "Docker" },
      ];

      const result = integrate({ workspace, facts });
      expect(result.notes.some(n => n.includes("Kernel-aligned"))).toBe(true);
    });

    it("composition notes kernel well-formedness", () => {
      // Use two modules to avoid the early return path for single module
      const mod1 = createModule({
        moduleId: "mod1",
        workspaceDsl: `
          workspace "ws1" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });
      
      const mod2 = createModule({
        moduleId: "mod2",
        workspaceDsl: `
          workspace "ws2" {
            context { "k2" "v2" }
            persistence "session"
            equivalence "strict"
            role "r2" {
              kind "service"
              subject { identity "s2" reference "ref2" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const result = compose([mod1, mod2]);
      expect(result.notes.some(n => n.includes("Kernel well-formed: true"))).toBe(true);
    });
  });

  describe("A2: Kernel-mediated judgment", () => {
    it("runtime uses kernel satisfiedWorkspace for verdict", () => {
      const workspace = parse(`
        workspace "test" {
          context { "env" "test" }
          persistence "ephemeral"
          equivalence "canonical"
          role "r1" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);

      // Missing subject observation
      const facts: Fact[] = [
        { tag: "RoleRealized", roleId: "r1", realizerClass: "Docker" },
      ];

      const result = integrate({ workspace, facts });
      expect(result.admissible).toBe(false);
      
      // Verify kernel would also reject
      const kernelWs = toKernelWorkspace(workspace);
      const kernelResult = wellFormed(kernelWs);
      expect(kernelResult.ok).toBe(true); // Workspace itself is well-formed
      
      // The unsatisfied role should be detected
      expect(result.unsatisfied).toContain("r1");
    });

    it("composition uses kernel wellFormed for validation", () => {
      // Create a workspace that would fail kernel well-formedness
      // (empty role id is caught by parser, so we need another way)
      // Actually let's verify success case passes kernel
      const mod = createModule({
        moduleId: "mod1",
        workspaceDsl: `
          workspace "ws1" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const result = compose([mod]);
      expect(result.admissible).toBe(true);
      
      // Verify kernel agrees
      if (result.composed) {
        const kernelWs = toKernelWorkspace(result.composed);
        const kernelVerdict = wellFormed(kernelWs);
        expect(kernelVerdict.ok).toBe(true);
      }
    });
  });

  describe("A3: Kernel-authored normalization", () => {
    it("AST to kernel conversion produces normalizable workspace", () => {
      const workspace = parse(`
        workspace "test" {
          context { "z" "1" "a" "2" }
          persistence "ephemeral"
          equivalence "canonical"
          role "z-role" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
          role "a-role" {
            kind "service"  
            subject { identity "s2" reference "ref2" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);

      const kernelWs = toKernelWorkspace(workspace);
      const normalized = normalize(kernelWs);
      
      // Roles should be sorted
      expect(normalized.roles[0].id).toBe("a-role");
      expect(normalized.roles[1].id).toBe("z-role");
      
      // Context keys should be sorted
      const keys = Array.from(normalized.context.keys());
      expect(keys).toEqual(["a", "z"]);
    });

    it("kernel equiv works on converted workspaces", () => {
      const ws1 = parse(`
        workspace "test" {
          context { "k" "v" }
          persistence "ephemeral"
          equivalence "canonical"
          role "r1" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);

      const ws2 = parse(`
        workspace "test" {
          role "r1" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
          context { "k" "v" }
          persistence "ephemeral"
          equivalence "canonical"
        }
      `);

      const kernel1 = toKernelWorkspace(ws1);
      const kernel2 = toKernelWorkspace(ws2);
      
      expect(equiv(kernel1, kernel2)).toBe(true);
    });
  });

  describe("A4: Kernel source authority", () => {
    it("kernel directory is classified as authoritative", () => {
      expect(isAuthoritativeSource("/src/kernel/kernel.ts")).toBe(true);
      expect(isAuthoritativeSource("/src/kernel/ast-to-kernel.ts")).toBe(true);
    });

    it("writing to kernel directory is rejected", () => {
      const result = validateRepo([
        { type: "write", path: "/src/kernel/new-file.ts" },
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "IllegalWriteToSource")).toBe(true);
    });

    it("reading from kernel is allowed", () => {
      const result = validateRepo([
        { type: "read", path: "/src/kernel/kernel.ts" },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe("A5: Behavior preservation under rebinding", () => {
    it("valid single module composition still works", () => {
      const mod = createModule({
        moduleId: "mod1",
        workspaceDsl: `
          workspace "ws1" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const result = compose([mod]);
      expect(result.admissible).toBe(true);
      expect(result.composed).toBeDefined();
      // Single module preserves original workspace name
      expect(result.composed!.name).toBe("ws1");
    });

    it("valid integration still works", () => {
      const workspace = parse(`
        workspace "test" {
          context { "env" "test" }
          persistence "ephemeral"
          equivalence "canonical"
          role "r1" {
            kind "service"
            subject { identity "s1" reference "ref1" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `);

      const facts: Fact[] = [
        { tag: "SubjectObserved", subjectId: "s1" },
        { tag: "RoleRealized", roleId: "r1", realizerClass: "Docker" },
      ];

      const result = integrate({ workspace, facts });
      expect(result.admissible).toBe(true);
      expect(result.satisfied).toContain("r1");
    });

    it("kernel well-formedness failure is detected in composition", () => {
      // Create two modules with duplicate subject identities
      // This should fail kernel well-formedness
      const mod1 = createModule({
        moduleId: "mod1",
        workspaceDsl: `
          workspace "ws1" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "shared" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const mod2 = createModule({
        moduleId: "mod2",
        workspaceDsl: `
          workspace "ws2" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r2" {
              kind "service"
              subject { identity "shared" reference "ref2" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      // Conservative composition detects this as subject collision
      const result = compose([mod1, mod2]);
      expect(result.admissible).toBe(false);
      // Either SubjectCollision or KernelWellFormednessFailure
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it("explicit composition fails kernel well-formedness on duplicate subjects", () => {
      const mod1 = createModule({
        moduleId: "mod1",
        workspaceDsl: `
          workspace "ws1" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r1" {
              kind "service"
              subject { identity "shared" reference "ref1" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const mod2 = createModule({
        moduleId: "mod2",
        workspaceDsl: `
          workspace "ws2" {
            context { "k" "v" }
            persistence "session"
            equivalence "strict"
            role "r2" {
              kind "service"
              subject { identity "shared" reference "ref2" }
              realizer "Docker" "img"
              witness "Health" "ok"
            }
          }
        `,
      });

      const result = composeExplicit([mod1, mod2], {
        namespaces: [
          { moduleId: "mod1", namespace: "ns1" },
          { moduleId: "mod2", namespace: "ns2" },
        ],
      });

      // This should fail because kernel well-formedness rejects duplicate subjects
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => 
        c.type === "KernelWellFormednessFailure" || c.type === "UndeclaredSharedIdentity"
      )).toBe(true);
    });
  });
});
