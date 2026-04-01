/**
 * Cross-Backend Execution Parity Types
 *
 * Types for checking parity between WT+WSL and tmux backends.
 * Law families P1-P6 from lawbook 046 (Task 021).
 */
import type { WtWslBackendPlan } from "./wt-wsl-backend.js";
import type { TmuxBackendPlan } from "./tmux-backend.js";
/**
 * Input for parity checking
 */
export type BackendParityInput = {
    wtWslPlan: WtWslBackendPlan;
    tmuxPlan: TmuxBackendPlan;
    actionClass: "command" | "attach" | "tail";
};
/**
 * Parity violation types
 */
export type BackendParityViolation = ActionClassMismatchViolation | SelectorExplicitnessMismatchViolation | IntentStepMismatchViolation | ObservationBoundaryMismatchViolation | SemanticFieldLeakViolation;
export type ActionClassMismatchViolation = {
    tag: "ActionClassMismatch";
    wtWslClass: string;
    tmuxClass: string;
};
export type SelectorExplicitnessMismatchViolation = {
    tag: "SelectorExplicitnessMismatch";
    selector: "profile" | "distro" | "window" | "session" | "tab";
    wtWslHasSelector: boolean;
    tmuxHasSelector: boolean;
};
export type IntentStepMismatchViolation = {
    tag: "IntentStepMismatch";
    expectedIntent: "command" | "attach" | "tail";
    wtWslIntent: string;
    tmuxIntent: string;
};
export type ObservationBoundaryMismatchViolation = {
    tag: "ObservationBoundaryMismatch";
    wtWslObservations: string[];
    tmuxObservations: string[];
};
export type SemanticFieldLeakViolation = {
    tag: "SemanticFieldLeak";
    backend: "wtwsl" | "tmux";
    fields: string[];
};
/**
 * Parity check verdict
 */
export type BackendParityVerdict = {
    aligned: true;
    violations: [];
} | {
    aligned: false;
    violations: BackendParityViolation[];
};
//# sourceMappingURL=backend-parity.d.ts.map