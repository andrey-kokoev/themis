/**
 * Module / Import Resolution Tests
 * 
 * Tests for Task 025: Module / Import Resolution Semantics
 * Covers law families M1-M6 from lawbook 054.
 */

import { describe, it, expect } from "vitest";
import {
  buildRegistry,
  resolveModuleGraph,
  getTransitiveImports,
  canResolve,
  getResolutionErrors,
} from "../src/module-resolution/resolver.js";
import type { SurfaceModule } from "../src/types/surface-module.js";

// Helper to create a minimal surface module
function createModule(
  moduleId: string,
  imports: string[] = []
): SurfaceModule {
  return {
    tag: "Module",
    moduleId,
    imports: imports.map(id => ({ tag: "Import", moduleId: id })),
    namespaces: [],
    aliases: [],
    sharedIdentities: [],
    workspace: {
      tag: "Workspace",
      name: `${moduleId}-ws`,
      items: [],
    },
  };
}

describe("Module / Import Resolution (M1-M6)", () => {
  describe("M1: Identity Laws", () => {
    it("registry builds successfully for unique module ids", () => {
      const modules: SurfaceModule[] = [
        createModule("mod-a"),
        createModule("mod-b"),
        createModule("mod-c"),
      ];

      const result = buildRegistry(modules);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.keys(result.registry)).toHaveLength(3);
        expect(result.registry["mod-a"]).toBeDefined();
        expect(result.registry["mod-b"]).toBeDefined();
        expect(result.registry["mod-c"]).toBeDefined();
      }
    });

    it("duplicate module id fails registry construction", () => {
      const modules: SurfaceModule[] = [
        createModule("mod-a"),
        createModule("mod-b"),
        createModule("mod-a"), // Duplicate
      ];

      const result = buildRegistry(modules);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].tag).toBe("DuplicateModuleId");
        expect(result.errors[0].moduleId).toBe("mod-a");
      }
    });

    it("module identity is exact moduleId only", () => {
      // Module identity comes only from declared moduleId
      const mod = createModule("my-exact-id");
      expect(mod.moduleId).toBe("my-exact-id");
      // Not from workspace name
      expect(mod.workspace.name).not.toBe(mod.moduleId);
    });
  });

  describe("M2: Binding Laws", () => {
    it("single import resolves exactly", () => {
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-b", registryResult.registry);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.graph.order).toContain("mod-a");
          expect(result.graph.order).toContain("mod-b");
        }
      }
    });

    it("missing import fails with MissingImport", () => {
      const modA = createModule("mod-a", ["missing-mod"]);

      const registryResult = buildRegistry([modA]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors.some(e => e.tag === "MissingImport")).toBe(true);
          const missingError = result.errors.find(e => e.tag === "MissingImport");
          expect(missingError?.importer).toBe("mod-a");
          expect(missingError?.missing).toBe("missing-mod");
        }
      }
    });

    it("import requires exact match", () => {
      const modA = createModule("mod-a-exact");
      const modB = createModule("mod-b", ["mod-a"]); // Different from "mod-a-exact"

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-b", registryResult.registry);

        // Should fail - no fuzzy matching
        expect(result.ok).toBe(false);
      }
    });
  });

  describe("M3: Graph Laws", () => {
    it("root module with no imports resolves to graph of size 1", () => {
      const modA = createModule("mod-a");

      const registryResult = buildRegistry([modA]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.graph.root).toBe("mod-a");
          expect(result.graph.order).toHaveLength(1);
          expect(Object.keys(result.graph.modules)).toHaveLength(1);
        }
      }
    });

    it("root is always included in graph", () => {
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-b", registryResult.registry);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.graph.modules["mod-b"]).toBeDefined();
          expect(result.graph.order[result.graph.order.length - 1]).toBe("mod-b");
        }
      }
    });

    it("multi-module graph resolves in deterministic order", () => {
      // Create modules with multiple imports
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);
      const modC = createModule("mod-c", ["mod-a", "mod-b"]);

      const registryResult = buildRegistry([modA, modB, modC]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        // Resolve twice to check determinism
        const result1 = resolveModuleGraph("mod-c", registryResult.registry);
        const result2 = resolveModuleGraph("mod-c", registryResult.registry);

        expect(result1.ok).toBe(true);
        expect(result2.ok).toBe(true);
        if (result1.ok && result2.ok) {
          expect(result1.graph.order).toEqual(result2.graph.order);
        }
      }
    });

    it("no partial graph on failure", () => {
      const modA = createModule("mod-a", ["missing"]);
      const modB = createModule("mod-b");

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        // Should fail entirely, not return partial graph
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("M4: Cycle Laws", () => {
    it("cycle A -> B -> A fails with ImportCycle", () => {
      const modA = createModule("mod-a", ["mod-b"]);
      const modB = createModule("mod-b", ["mod-a"]);

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors.some(e => e.tag === "ImportCycle")).toBe(true);
          const cycleError = result.errors.find(e => e.tag === "ImportCycle");
          expect(cycleError?.cycle).toContain("mod-a");
          expect(cycleError?.cycle).toContain("mod-b");
        }
      }
    });

    it("longer cycle fails with explicit cycle path", () => {
      const modA = createModule("mod-a", ["mod-b"]);
      const modB = createModule("mod-b", ["mod-c"]);
      const modC = createModule("mod-c", ["mod-d"]);
      const modD = createModule("mod-d", ["mod-a"]); // Closes the cycle

      const registryResult = buildRegistry([modA, modB, modC, modD]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          const cycleError = result.errors.find(e => e.tag === "ImportCycle");
          expect(cycleError).toBeDefined();
          expect(cycleError?.cycle.length).toBeGreaterThanOrEqual(4);
        }
      }
    });

    it("self-import cycle detected", () => {
      const modA = createModule("mod-a", ["mod-a"]);

      const registryResult = buildRegistry([modA]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors.some(e => e.tag === "ImportCycle")).toBe(true);
        }
      }
    });
  });

  describe("M5: Separation Laws", () => {
    it("resolution builds graph only, does not compose", () => {
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);

      const registryResult = buildRegistry([modA, modB]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-b", registryResult.registry);

        expect(result.ok).toBe(true);
        if (result.ok) {
          // Graph contains modules, not composed workspace
          expect(result.graph.modules["mod-a"]).toBeDefined();
          expect(result.graph.modules["mod-b"]).toBeDefined();
          // No composed workspace in result
          expect((result.graph as any).composed).toBeUndefined();
        }
      }
    });

    it("modules in graph are unchanged from registry", () => {
      const modA = createModule("mod-a");

      const registryResult = buildRegistry([modA]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result = resolveModuleGraph("mod-a", registryResult.registry);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.graph.modules["mod-a"]).toBe(
            registryResult.registry["mod-a"]
          );
        }
      }
    });
  });

  describe("M6: Determinism", () => {
    it("same root and registry yields same verdict", () => {
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);
      const modC = createModule("mod-c", ["mod-a", "mod-b"]);

      const registryResult = buildRegistry([modA, modB, modC]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const result1 = resolveModuleGraph("mod-c", registryResult.registry);
        const result2 = resolveModuleGraph("mod-c", registryResult.registry);

        expect(result1).toEqual(result2);
      }
    });

    it("canResolve returns boolean without full graph", () => {
      const modA = createModule("mod-a");
      const registryResult = buildRegistry([modA]);
      
      if (registryResult.ok) {
        expect(canResolve("mod-a", registryResult.registry)).toBe(true);
        expect(canResolve("nonexistent", registryResult.registry)).toBe(false);
      }
    });

    it("getResolutionErrors returns errors without full graph", () => {
      const modA = createModule("mod-a", ["missing"]);
      const registryResult = buildRegistry([modA]);

      if (registryResult.ok) {
        const errors = getResolutionErrors("mod-a", registryResult.registry);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Helper Functions", () => {
    it("getTransitiveImports returns all transitive dependencies", () => {
      const modA = createModule("mod-a");
      const modB = createModule("mod-b", ["mod-a"]);
      const modC = createModule("mod-c", ["mod-b"]);

      const registryResult = buildRegistry([modA, modB, modC]);
      expect(registryResult.ok).toBe(true);

      if (registryResult.ok) {
        const transitive = getTransitiveImports(
          "mod-c",
          registryResult.registry
        );

        expect(transitive).toContain("mod-a");
        expect(transitive).toContain("mod-b");
      }
    });

    it("unknown root module fails with UnknownRootModule", () => {
      const modA = createModule("mod-a");
      const registryResult = buildRegistry([modA]);

      if (registryResult.ok) {
        const result = resolveModuleGraph("nonexistent", registryResult.registry);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors[0].tag).toBe("UnknownRootModule");
          expect((result.errors[0] as any).root).toBe("nonexistent");
        }
      }
    });
  });
});
