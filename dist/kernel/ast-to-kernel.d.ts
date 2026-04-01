/**
 * AST to Kernel Converter
 *
 * Converts surface AST Workspace to KernelWorkspace for kernel operations.
 * This is the bridge layer that enables downstream modules to use explicit kernel semantics.
 */
import type { Workspace } from "../types/ast.js";
import type { KernelWorkspace } from "../types/kernel.js";
/**
 * Convert AST Workspace to KernelWorkspace.
 *
 * This projection extracts the semantic core needed for kernel operations.
 * It intentionally loses surface-level details (e.g., source location) that
 * don't affect semantic satisfaction.
 */
export declare function toKernelWorkspace(workspace: Workspace): KernelWorkspace;
//# sourceMappingURL=ast-to-kernel.d.ts.map