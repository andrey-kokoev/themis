/**
 * Module / Import Resolution
 * 
 * Implements lawbook 054 (Task 025).
 * Deterministic resolution of symbolic module imports.
 */

import type {
  SurfaceModule,
  ImportDecl,
} from "../types/surface-module.js";
import type {
  ModuleRegistry,
  ResolvedModuleGraph,
  ModuleResolutionVerdict,
  RegistryVerdict,
  ModuleResolutionError,
  DuplicateModuleIdError,
  MissingImportError,
  ImportCycleError,
  UnknownRootModuleError,
} from "../types/module-resolution.js";

/**
 * Build module registry from surface modules.
 * 
 * Law M1: Identity and duplicate detection.
 */
export function buildRegistry(modules: SurfaceModule[]): RegistryVerdict {
  const registry: ModuleRegistry = {};
  const errors: DuplicateModuleIdError[] = [];

  for (const mod of modules) {
    if (registry[mod.moduleId]) {
      errors.push({ tag: "DuplicateModuleId", moduleId: mod.moduleId });
    } else {
      registry[mod.moduleId] = mod;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, registry };
}

/**
 * Resolve module graph from root module.
 * 
 * Law M2: Binding (exact lookup).
 * Law M3: Graph construction.
 * Law M4: Cycle detection.
 * Law M6: Determinism.
 */
export function resolveModuleGraph(
  rootId: string,
  registry: ModuleRegistry
): ModuleResolutionVerdict {
  const errors: ModuleResolutionError[] = [];

  // Check root exists
  if (!registry[rootId]) {
    return { ok: false, errors: [{ tag: "UnknownRootModule", root: rootId }] };
  }

  // Track visited modules and detection state for cycle detection
  const visited = new Set<string>(); // Fully processed
  const inStack = new Set<string>(); // Currently in DFS stack
  const stack: string[] = []; // DFS stack for cycle path reconstruction

  // Result graph
  const modules: Record<string, SurfaceModule> = {};
  const order: string[] = [];

  function visit(moduleId: string): boolean {
    // If already fully processed, ok
    if (visited.has(moduleId)) {
      return true;
    }

    // If in current stack, we found a cycle
    if (inStack.has(moduleId)) {
      // Build cycle path
      const cycleStart = stack.indexOf(moduleId);
      const cycle = [...stack.slice(cycleStart), moduleId];
      errors.push({ tag: "ImportCycle", cycle });
      return false;
    }

    // Check module exists in registry
    const mod = registry[moduleId];
    if (!mod) {
      // Find who imported this missing module
      const importer = stack[stack.length - 1] || rootId;
      errors.push({ tag: "MissingImport", importer, missing: moduleId });
      return false;
    }

    // Add to stack
    inStack.add(moduleId);
    stack.push(moduleId);

    // Visit imports in deterministic (lexical) order
    // Law M3.1: imports processed in lexical order
    const sortedImports = [...mod.imports].sort((a, b) =>
      a.moduleId.localeCompare(b.moduleId)
    );

    for (const imp of sortedImports) {
      if (!visit(imp.moduleId)) {
        // Error already added, propagate failure
        // Continue to find all errors
      }
    }

    // Remove from stack, mark as visited
    stack.pop();
    inStack.delete(moduleId);
    visited.add(moduleId);

    // Add to result
    modules[moduleId] = mod;
    order.push(moduleId);

    return true;
  }

  // Start DFS from root
  visit(rootId);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const graph: ResolvedModuleGraph = {
    tag: "ResolvedModuleGraph",
    root: rootId,
    order,
    modules,
  };

  return { ok: true, graph };
}

/**
 * Get all imports of a module (transitive).
 * For debugging and analysis.
 */
export function getTransitiveImports(
  moduleId: string,
  registry: ModuleRegistry,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(moduleId)) {
    return [];
  }

  const mod = registry[moduleId];
  if (!mod) {
    return [];
  }

  visited.add(moduleId);

  const result: string[] = [];
  for (const imp of mod.imports) {
    result.push(imp.moduleId);
    result.push(...getTransitiveImports(imp.moduleId, registry, visited));
  }

  return [...new Set(result)];
}

/**
 * Check if resolution would succeed without actually resolving.
 */
export function canResolve(
  rootId: string,
  registry: ModuleRegistry
): boolean {
  const result = resolveModuleGraph(rootId, registry);
  return result.ok;
}

/**
 * Get resolution errors without full graph.
 */
export function getResolutionErrors(
  rootId: string,
  registry: ModuleRegistry
): ModuleResolutionError[] {
  const result = resolveModuleGraph(rootId, registry);
  return result.ok ? [] : result.errors;
}
