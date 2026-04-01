/**
 * Canonical Renderer for Themis AST
 *
 * Implements rendering laws R1-R5 from lawbook 028.
 * Produces deterministic, idempotent canonical form.
 */
import type { Workspace } from "../types/ast.js";
/**
 * Render a Workspace AST to canonical string form.
 *
 * Law R1: Uniqueness - each AST has exactly one canonical form
 * Law R3: Ordering - enforced via sorting where applicable
 */
export declare function render(workspace: Workspace): string;
//# sourceMappingURL=canonical-renderer.d.ts.map