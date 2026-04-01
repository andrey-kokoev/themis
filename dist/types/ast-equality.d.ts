/**
 * AST Equality Helpers
 *
 * For testing round-trip invariants and idempotence.
 */
import type { Workspace } from "./ast.js";
/**
 * Deep equality comparison for two Workspaces.
 *
 * Used to verify R5.1 round-trip invariant:
 * parse(input) -> render -> parse should produce equal AST
 */
export declare function workspacesEqual(a: Workspace, b: Workspace): boolean;
//# sourceMappingURL=ast-equality.d.ts.map