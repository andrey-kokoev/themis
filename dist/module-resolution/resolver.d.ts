/**
 * Module / Import Resolution
 *
 * Implements lawbook 054 (Task 025).
 * Deterministic resolution of symbolic module imports.
 */
import type { SurfaceModule } from "../types/surface-module.js";
import type { ModuleRegistry, ModuleResolutionVerdict, RegistryVerdict, ModuleResolutionError } from "../types/module-resolution.js";
/**
 * Build module registry from surface modules.
 *
 * Law M1: Identity and duplicate detection.
 */
export declare function buildRegistry(modules: SurfaceModule[]): RegistryVerdict;
/**
 * Resolve module graph from root module.
 *
 * Law M2: Binding (exact lookup).
 * Law M3: Graph construction.
 * Law M4: Cycle detection.
 * Law M6: Determinism.
 */
export declare function resolveModuleGraph(rootId: string, registry: ModuleRegistry): ModuleResolutionVerdict;
/**
 * Get all imports of a module (transitive).
 * For debugging and analysis.
 */
export declare function getTransitiveImports(moduleId: string, registry: ModuleRegistry, visited?: Set<string>): string[];
/**
 * Check if resolution would succeed without actually resolving.
 */
export declare function canResolve(rootId: string, registry: ModuleRegistry): boolean;
/**
 * Get resolution errors without full graph.
 */
export declare function getResolutionErrors(rootId: string, registry: ModuleRegistry): ModuleResolutionError[];
//# sourceMappingURL=resolver.d.ts.map