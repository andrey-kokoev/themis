/**
 * Module Parser for Themis DSL
 *
 * Implements module/import surface syntax (Task 017).
 * Extends minimal parser with module root and composition declarations.
 */
import type { SurfaceModule, LoweredModule } from "../types/surface-module.js";
export declare class ModuleParseError extends Error {
    line: number;
    column: number;
    constructor(message: string, line: number, column: number);
}
export declare class MultipleModuleRootsError extends ModuleParseError {
    constructor(line: number, column: number);
}
export declare class MissingWorkspaceError extends ModuleParseError {
    constructor(line: number, column: number);
}
export declare class InvalidPlacementError extends ModuleParseError {
    constructor(what: string, line: number, column: number);
}
export declare function parseModule(input: string): SurfaceModule;
export declare function lowerModule(surface: SurfaceModule): LoweredModule;
//# sourceMappingURL=module-parser.d.ts.map