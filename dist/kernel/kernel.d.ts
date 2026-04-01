/**
 * Themis Kernel
 *
 * Implements kernel laws K1-K5.
 * Minimal semantic core with well-formedness, normalization, equivalence, and satisfaction.
 */
import type { KernelWorkspace, KernelVerdict, SatisfactionResult } from "../types/kernel.js";
import type { Fact } from "../types/runtime-integration.js";
/**
 * Check if workspace is well-formed.
 * Law K2.1: Workspace well-formedness
 */
export declare function wellFormed(workspace: KernelWorkspace): KernelVerdict;
/**
 * Normalize workspace for deterministic comparison.
 * Law K3: Deterministic ordering
 */
export declare function normalize(workspace: KernelWorkspace): KernelWorkspace;
/**
 * Check equivalence of two workspaces.
 * Law K4: equiv(a, b) := normalize(a) == normalize(b)
 */
export declare function equiv(a: KernelWorkspace, b: KernelWorkspace): boolean;
/**
 * Check if a role is satisfied by observed facts.
 * Law K5.1: Role satisfaction
 */
export declare function satisfiedRole(workspace: KernelWorkspace, facts: Fact[], roleId: string): SatisfactionResult;
/**
 * Check if workspace is satisfied by observed facts.
 * Law K5.2: Workspace satisfaction
 */
export declare function satisfiedWorkspace(workspace: KernelWorkspace, facts: Fact[]): SatisfactionResult;
//# sourceMappingURL=kernel.d.ts.map