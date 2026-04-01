/**
 * Operator Intervention Protocol
 *
 * Implements operator action evaluation (Task 018).
 * Law families O1-O5 from lawbook 040.
 */
import type { OperatorAction, OperatorActionVerdict, OperatorRuntimeState } from "../types/operator-intervention.js";
/**
 * Evaluate operator action against runtime state.
 *
 * Law O2: Each action has explicit admissibility preconditions.
 * Law O3: No semantic override (actions don't assert satisfaction).
 * Law O4: Deterministic evaluation.
 */
export declare function evaluateOperatorAction(state: OperatorRuntimeState, action: OperatorAction): OperatorActionVerdict;
/**
 * Check if an action can be replayed given current state.
 *
 * Law O4: Inadmissible replay must fail explicitly.
 */
export declare function canReplayAction(state: OperatorRuntimeState, action: OperatorAction): {
    canReplay: boolean;
    reason?: string;
};
//# sourceMappingURL=operator-intervention.d.ts.map