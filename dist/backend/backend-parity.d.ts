/**
 * Cross-Backend Execution Parity Checker
 *
 * Implements lawbook 046 (Task 021).
 * Checks semantic parity between WT+WSL and tmux backend plans.
 */
import type { BackendParityInput, BackendParityVerdict, BackendParityViolation } from "../types/backend-parity.js";
/**
 * Check parity between WT+WSL and tmux backend plans.
 *
 * Law P1: Intent parity
 * Law P2: No class drift
 * Law P3: Selector explicitness parity
 * Law P4: Observation parity
 * Law P5: Non-semantic backend plans
 * Law P6: Deterministic parity check
 */
export declare function checkBackendParity(input: BackendParityInput): BackendParityVerdict;
/**
 * Check if parity verdict indicates alignment.
 */
export declare function isAligned(verdict: BackendParityVerdict): boolean;
/**
 * Get parity violations if any.
 */
export declare function getViolations(verdict: BackendParityVerdict): BackendParityViolation[];
//# sourceMappingURL=backend-parity.d.ts.map