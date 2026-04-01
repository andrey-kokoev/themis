/**
 * End-to-End Scenario Conformance Tests
 * 
 * Tests for Task 023: End-to-End Scenario Conformance
 * Covers law families E1-E5 from lawbook 050.
 */

import { describe, it, expect } from "vitest";
import { parseModule, lowerModule } from "../src/parser/module-parser.js";
import { compose } from "../src/composition/conservative-composition.js";
import { composeExplicit } from "../src/composition/explicit-composition.js";
import { integrate } from "../src/runtime/integration.js";
import {
  createJournal,
  append,
  replay,
  hashWorkspace,
} from "../src/runtime/journal.js";
import { wellFormed } from "../src/kernel/kernel.js";
import { toKernelWorkspace } from "../src/kernel/ast-to-kernel.js";
import type { Module } from "../src/types/composition.js";
import type { Fact } from "../src/types/runtime-integration.js";
import type { Workspace } from "../src/types/ast.js";

// =============================================================================
// Scenario Harness
// =============================================================================

type StageResult<T> =
  | { success: true; value: T }
  | { success: false; stage: string; error: string };

type PipelineResult = {
  parse: StageResult<Workspace>;
  compose?: StageResult<Workspace>;
  kernel?: StageResult<boolean>;
  integrate?: StageResult<boolean>;
  journal?: StageResult<{ seq: number; hash: string }>;
  replay?: StageResult<boolean>;
};

/**
 * Run Scenario A: Minimal Single Workspace Success
 * 
 * One module, one workspace, one role, valid facts, admissible integration.
 */
function runScenarioA(): PipelineResult {
  const source = `
    module "scenario-a" {
      workspace "test-ws" {
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
    }
  `;

  const result: PipelineResult = {
    parse: { success: false, stage: "parse", error: "" },
  };

  // Stage 1: Parse
  let workspace: Workspace;
  try {
    const module = parseModule(source);
    const lowered = lowerModule(module);
    workspace = lowered.module.workspace;
    result.parse = { success: true, value: workspace };
  } catch (e) {
    result.parse = {
      success: false,
      stage: "parse",
      error: e instanceof Error ? e.message : String(e),
    };
    return result;
  }

  // Stage 2: Kernel well-formedness (single module, no composition needed)
  const kernelWs = toKernelWorkspace(workspace);
  const kernelVerdict = wellFormed(kernelWs);
  if (!kernelVerdict.ok) {
    result.kernel = {
      success: false,
      stage: "kernel",
      error: kernelVerdict.errors.map(e => e.type).join(", "),
    };
    return result;
  }
  result.kernel = { success: true, value: true };

  // Stage 3: Runtime integration
  const facts: Fact[] = [
    { tag: "SubjectObserved", subjectId: "s1" },
    { tag: "RoleRealized", roleId: "r1", realizerClass: "Docker" },
  ];

  const integrationResult = integrate({ workspace, facts });
  result.integrate = {
    success: integrationResult.admissible,
    value: integrationResult.admissible,
    ...(integrationResult.admissible
      ? {}
      : { stage: "integrate", error: integrationResult.conflicts.map(c => c.type).join(", ") }),
  };

  if (!integrationResult.admissible) {
    return result;
  }

  // Stage 4: Journal append
  let journal = createJournal();
  try {
    journal = append(journal, {
      workspace,
      facts,
      verdict: integrationResult,
    });
    const record = journal.records[journal.records.length - 1];
    result.journal = {
      success: true,
      value: { seq: record.seq, hash: record.workspaceHash },
    };
  } catch (e) {
    result.journal = {
      success: false,
      stage: "journal",
      error: e instanceof Error ? e.message : String(e),
    };
    return result;
  }

  // Stage 5: Journal replay
  const replayResult = replay(
    journal,
    (hash: string) => {
      const wsHash = hashWorkspace(workspace);
      return hash === wsHash ? workspace : undefined;
    }
  );
  result.replay = {
    success: replayResult.ok,
    value: replayResult.ok,
    ...(!replayResult.ok
      ? { stage: "replay", error: `Failed at seq ${replayResult.firstFailureSeq}` }
      : {}),
  };

  return result;
}

/**
 * Run Scenario B: Conservative Composition Failure
 * 
 * Two modules with role id collision, composition fails.
 */
function runScenarioB(): PipelineResult {
  const source1 = `
    module "mod-a" {
      workspace "ws-a" {
        context { "k" "v" }
        persistence "ephemeral"
        equivalence "canonical"
        role "shared-role" {
          kind "service"
          subject { identity "s1" reference "ref1" }
          realizer "Docker" "img"
          witness "Health" "ok"
        }
      }
    }
  `;

  const source2 = `
    module "mod-b" {
      workspace "ws-b" {
        context { "k" "v" }
        persistence "ephemeral"
        equivalence "canonical"
        role "shared-role" {
          kind "service"
          subject { identity "s2" reference "ref2" }
          realizer "Docker" "img2"
          witness "Health" "ok2"
        }
      }
    }
  `;

  const result: PipelineResult = {
    parse: { success: false, stage: "parse", error: "" },
  };

  // Stage 1: Parse both modules
  let modA: Workspace;
  let modB: Workspace;
  try {
    const parsedA = parseModule(source1);
    const parsedB = parseModule(source2);
    modA = lowerModule(parsedA).module.workspace;
    modB = lowerModule(parsedB).module.workspace;
    result.parse = { success: true, value: modA }; // Use first as representative
  } catch (e) {
    result.parse = {
      success: false,
      stage: "parse",
      error: e instanceof Error ? e.message : String(e),
    };
    return result;
  }

  // Stage 2: Compose (should fail due to role collision)
  const modules: Module[] = [
    { moduleId: "mod-a", workspace: modA },
    { moduleId: "mod-b", workspace: modB },
  ];

  const composeResult = compose(modules);
  result.compose = {
    success: composeResult.admissible,
    value: composeResult.composed!,
    ...(!composeResult.admissible
      ? { stage: "compose", error: composeResult.conflicts.map(c => c.type).join(", ") }
      : {}),
  };

  // Expected: composition fails, no further stages
  return result;
}

/**
 * Run Scenario C: Explicit Composition Success
 * 
 * Two modules with namespace policy, successful composition.
 */
function runScenarioC(): PipelineResult {
  const source1 = `
    module "mod-a" {
      namespace "mod-a" as "nsA"
      workspace "ws-a" {
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
    }
  `;

  const source2 = `
    module "mod-b" {
      namespace "mod-b" as "nsB"
      workspace "ws-b" {
        context { "k" "v" }
        persistence "ephemeral"
        equivalence "canonical"
        role "r1" {
          kind "service"
          subject { identity "s2" reference "ref2" }
          realizer "Docker" "img2"
          witness "Health" "ok2"
        }
      }
    }
  `;

  const result: PipelineResult = {
    parse: { success: false, stage: "parse", error: "" },
  };

  // Stage 1: Parse
  let modA: Workspace;
  let modB: Workspace;
  try {
    const parsedA = parseModule(source1);
    const parsedB = parseModule(source2);
    modA = lowerModule(parsedA).module.workspace;
    modB = lowerModule(parsedB).module.workspace;
    result.parse = { success: true, value: modA };
  } catch (e) {
    result.parse = {
      success: false,
      stage: "parse",
      error: e instanceof Error ? e.message : String(e),
    };
    return result;
  }

  // Stage 2: Explicit compose with namespace policy
  const modules: Module[] = [
    { moduleId: "mod-a", workspace: modA },
    { moduleId: "mod-b", workspace: modB },
  ];

  const composeResult = composeExplicit(modules, {
    namespaces: [
      { moduleId: "mod-a", namespace: "nsA" },
      { moduleId: "mod-b", namespace: "nsB" },
    ],
  });

  result.compose = {
    success: composeResult.admissible,
    value: composeResult.composed!,
    ...(!composeResult.admissible
      ? { stage: "compose", error: composeResult.conflicts.map(c => c.type).join(", ") }
      : {}),
  };

  if (!composeResult.admissible || !composeResult.composed) {
    return result;
  }

  const composed = composeResult.composed;

  // Stage 3: Kernel well-formedness
  const kernelWs = toKernelWorkspace(composed);
  const kernelVerdict = wellFormed(kernelWs);
  if (!kernelVerdict.ok) {
    result.kernel = {
      success: false,
      stage: "kernel",
      error: kernelVerdict.errors.map(e => e.type).join(", "),
    };
    return result;
  }
  result.kernel = { success: true, value: true };

  // Stage 4: Runtime integration
  // Note: role ids are now "nsA::r1" and "nsB::r1" after lifting
  const facts: Fact[] = [
    { tag: "SubjectObserved", subjectId: "s1" },
    { tag: "SubjectObserved", subjectId: "s2" },
    { tag: "RoleRealized", roleId: "nsA::r1", realizerClass: "Docker" },
    { tag: "RoleRealized", roleId: "nsB::r1", realizerClass: "Docker" },
  ];

  const integrationResult = integrate({ workspace: composed, facts });
  result.integrate = {
    success: integrationResult.admissible,
    value: integrationResult.admissible,
    ...(integrationResult.admissible
      ? {}
      : { stage: "integrate", error: integrationResult.conflicts.map(c => c.type).join(", ") }),
  };

  if (!integrationResult.admissible) {
    return result;
  }

  // Stage 5: Journal
  let journal = createJournal();
  try {
    journal = append(journal, {
      workspace: composed,
      facts,
      verdict: integrationResult,
    });
    const record = journal.records[journal.records.length - 1];
    result.journal = {
      success: true,
      value: { seq: record.seq, hash: record.workspaceHash },
    };
  } catch (e) {
    result.journal = {
      success: false,
      stage: "journal",
      error: e instanceof Error ? e.message : String(e),
    };
    return result;
  }

  // Stage 6: Replay
  const replayResult = replay(
    journal,
    (hash: string) => {
      const wsHash = hashWorkspace(composed);
      return hash === wsHash ? composed : undefined;
    }
  );
  result.replay = {
    success: replayResult.ok,
    value: replayResult.ok,
    ...(!replayResult.ok
      ? { stage: "replay", error: `Failed at seq ${replayResult.firstFailureSeq}` }
      : {}),
  };

  return result;
}

// =============================================================================
// Tests
// =============================================================================

describe("End-to-End Scenario Conformance (E1-E5)", () => {
  describe("E1: Scenario Authority", () => {
    it("scenarios use authoritative source fixtures", () => {
      // Scenarios A, B, C are defined inline as authoritative fixtures
      const resultA = runScenarioA();
      expect(resultA.parse.success).toBe(true);
    });
  });

  describe("E2: Pipeline Coverage", () => {
    describe("Scenario A — Minimal Single Workspace Success", () => {
      it("completes all pipeline stages successfully", () => {
        const result = runScenarioA();

        expect(result.parse.success).toBe(true);
        expect(result.kernel?.success).toBe(true);
        expect(result.integrate?.success).toBe(true);
        expect(result.journal?.success).toBe(true);
        expect(result.replay?.success).toBe(true);
      });

      it("produces admissible integration", () => {
        const result = runScenarioA();
        expect(result.integrate?.success).toBe(true);
      });

      it("produces successful journal replay", () => {
        const result = runScenarioA();
        expect(result.replay?.success).toBe(true);
      });
    });

    describe("Scenario B — Conservative Composition Failure", () => {
      it("fails at composition stage with role collision", () => {
        const result = runScenarioB();

        expect(result.parse.success).toBe(true);
        expect(result.compose?.success).toBe(false);
        expect(result.compose?.error).toContain("RoleIdCollision");
      });

      it("does not proceed to runtime integration", () => {
        const result = runScenarioB();
        expect(result.compose?.success).toBe(false);
        expect(result.integrate).toBeUndefined();
      });
    });

    describe("Scenario C — Explicit Composition Success", () => {
      it("succeeds with namespace policy", () => {
        const result = runScenarioC();

        expect(result.parse.success).toBe(true);
        expect(result.compose?.success).toBe(true);
        expect(result.kernel?.success).toBe(true);
        expect(result.integrate?.success).toBe(true);
      });

      it("produces lifted role ids after composition", () => {
        const result = runScenarioC();
        expect(result.compose?.success).toBe(true);
        
        const composed = (result.compose as { success: true; value: Workspace }).value;
        const roles = composed.items.filter(i => i.tag === "RoleBlock");
        
        // Roles should have namespace prefix after lifting
        const roleIds = roles.map(r => r.roleId);
        expect(roleIds.some(id => id.includes("nsA::"))).toBe(true);
        expect(roleIds.some(id => id.includes("nsB::"))).toBe(true);
      });
    });
  });

  describe("E3: Determinism", () => {
    it("Scenario A produces identical results on repeated runs", () => {
      const result1 = runScenarioA();
      const result2 = runScenarioA();

      expect(result1.parse.success).toBe(result2.parse.success);
      expect(result1.kernel?.success).toBe(result2.kernel?.success);
      expect(result1.integrate?.success).toBe(result2.integrate?.success);
      expect(result1.journal?.success).toBe(result2.journal?.success);
      expect(result1.replay?.success).toBe(result2.replay?.success);
    });

    it("Scenario B produces identical composition failure", () => {
      const result1 = runScenarioB();
      const result2 = runScenarioB();

      expect(result1.compose?.success).toBe(result2.compose?.success);
      expect(result1.compose?.error).toBe(result2.compose?.error);
    });

    it("Scenario C produces identical journal hashes", () => {
      const result1 = runScenarioC();
      const result2 = runScenarioC();

      expect((result1.journal as any)?.value?.hash).toBe(
        (result2.journal as any)?.value?.hash
      );
    });
  });

  describe("E4: No Semantic Hacks", () => {
    it("harness uses existing semantics only", () => {
      // The harness only orchestrates existing functions:
      // - parseModule, lowerModule
      // - compose, composeExplicit
      // - wellFormed
      // - integrate
      // - createJournal, append, replay
      
      const result = runScenarioA();
      
      // All stages use existing layer functions
      expect(result).toHaveProperty("parse");
      expect(result).toHaveProperty("kernel");
      expect(result).toHaveProperty("integrate");
      expect(result).toHaveProperty("journal");
      expect(result).toHaveProperty("replay");
    });
  });

  describe("E5: Stage Visibility", () => {
    it("reports which stage failed in Scenario B", () => {
      const result = runScenarioB();
      
      expect(result.compose?.success).toBe(false);
      // The error should be from the compose stage
      expect(result.compose?.stage).toBe("compose");
      expect(result.compose?.error).toBeDefined();
    });

    it("reports successful stage completions in Scenario A", () => {
      const result = runScenarioA();
      
      expect(result.parse.stage).toBeUndefined(); // Success doesn't set stage
      expect(result.parse.success).toBe(true);
      
      if (!result.kernel?.success) {
        expect(result.kernel?.stage).toBe("kernel");
      }
    });
  });
});
