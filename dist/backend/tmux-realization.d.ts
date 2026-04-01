/**
 * Tmux Concrete Backend Realization
 *
 * Implements lawbook 044 (Task 020).
 * Transforms tmux profile into executable backend plan.
 */
import type { TmuxActionProfile, TmuxBackendPlan } from "../types/tmux-backend.js";
/**
 * Realize tmux backend plan from profile.
 *
 * Law T1: Consumes existing profile semantics
 * Law T2: Action class mapping (command/attach/tail)
 * Law T3: Session/window naming constraints
 * Law T4: Observation boundary
 * Law T5: Non-judgment (no semantic verdicts)
 */
export declare function realizeTmuxBackend(profile: TmuxActionProfile): TmuxBackendPlan;
/**
 * Validate that backend plan contains no semantic judgment.
 *
 * Law T5: Backend must not emit semantic verdicts
 */
export declare function containsNoSemanticJudgment(plan: TmuxBackendPlan): boolean;
/**
 * Check backend plan determinism.
 *
 * Same input must yield same plan.
 */
export declare function isDeterministic(profile: TmuxActionProfile): boolean;
//# sourceMappingURL=tmux-realization.d.ts.map