/**
 * Operator Action Compensation
 *
 * Implements lawbook 048 (Task 022).
 * Evaluation and validation of compensation actions.
 */
import type { OperatorCompensationAction, CompensationVerdict, CompensationRuntimeState } from "../types/operator-compensation.js";
import type { OperatorActionRecord } from "../types/journal.js";
/**
 * Evaluate compensation action against runtime state.
 *
 * Law C2: Reversible action compensation rules.
 * Law C3: Compensation chain validity.
 */
export declare function evaluateCompensation(state: CompensationRuntimeState, action: OperatorCompensationAction): CompensationVerdict;
/**
 * Get list of compensable actions from journal.
 *
 * Returns actions that are reversible and not yet compensated.
 */
export declare function getCompensableActions(state: CompensationRuntimeState): OperatorActionRecord[];
/**
 * Check if an action can be compensated.
 */
export declare function canCompensate(state: CompensationRuntimeState, seq: number): boolean;
//# sourceMappingURL=operator-compensation.d.ts.map