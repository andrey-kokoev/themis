/**
 * Module / Import Resolution Types
 *
 * Types for deterministic module/import resolution.
 * Law families M1-M6 from lawbook 054 (Task 025).
 */
import type { SurfaceModule } from "./surface-module.js";
/**
 * Module registry: moduleId -> SurfaceModule
 */
export type ModuleRegistry = Record<string, SurfaceModule>;
/**
 * Resolved module graph.
 */
export type ResolvedModuleGraph = {
    tag: "ResolvedModuleGraph";
    root: string;
    /** Topologically sorted module order (if acyclic) */
    order: string[];
    /** Module lookup by id */
    modules: Record<string, SurfaceModule>;
};
/**
 * Module resolution error variants.
 */
export type ModuleResolutionError = DuplicateModuleIdError | MissingImportError | ImportCycleError | UnknownRootModuleError;
export type DuplicateModuleIdError = {
    tag: "DuplicateModuleId";
    moduleId: string;
};
export type MissingImportError = {
    tag: "MissingImport";
    importer: string;
    missing: string;
};
export type ImportCycleError = {
    tag: "ImportCycle";
    cycle: string[];
};
export type UnknownRootModuleError = {
    tag: "UnknownRootModule";
    root: string;
};
/**
 * Registry construction verdict.
 */
export type RegistryVerdict = {
    ok: true;
    registry: ModuleRegistry;
} | {
    ok: false;
    errors: DuplicateModuleIdError[];
};
/**
 * Module resolution verdict.
 */
export type ModuleResolutionVerdict = {
    ok: true;
    graph: ResolvedModuleGraph;
} | {
    ok: false;
    errors: ModuleResolutionError[];
};
//# sourceMappingURL=module-resolution.d.ts.map