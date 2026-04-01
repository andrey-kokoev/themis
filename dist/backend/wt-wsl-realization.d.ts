/**
 * WT+WSL Concrete Backend Realization
 *
 * Implements lawbook 042 (Task 019).
 * Transforms WT+WSL profile and routing decision into executable backend plan.
 */
import type { WindowsTerminalWslActionProfile, WtWslOperationalDecision, WtWslBackendPlan } from "../types/wt-wsl-backend.js";
/**
 * Realize WT+WSL backend plan from profile and routing decision.
 *
 * Law W1: Consumes existing profile/policy outputs
 * Law W2: Action class mapping (command/attach/tail)
 * Law W3: Selector explicitness (profile/distro)
 * Law W4: Observation boundary
 * Law W5: Non-judgment (no semantic verdicts)
 */
export declare function realizeWtWslBackend(profile: WindowsTerminalWslActionProfile, decision: WtWslOperationalDecision): WtWslBackendPlan;
/**
 * Validate that backend plan contains no semantic judgment.
 *
 * Law W5: Backend must not emit semantic verdicts
 */
export declare function containsNoSemanticJudgment(plan: WtWslBackendPlan): boolean;
/**
 * Check backend plan determinism.
 *
 * Same input must yield same plan.
 */
export declare function isDeterministic(profile: WindowsTerminalWslActionProfile, decision: WtWslOperationalDecision): boolean;
//# sourceMappingURL=wt-wsl-realization.d.ts.map