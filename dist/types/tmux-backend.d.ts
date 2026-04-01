/**
 * Tmux Backend Types
 *
 * Concrete backend realization for tmux.
 * Law families T1-T5 from lawbook 044 (Task 020).
 */
/**
 * Tmux Action Profile - describes desired tmux action
 */
export type TmuxActionProfile = {
    tag: "TmuxActionProfile";
    actionClass: "command" | "attach" | "tail";
    sessionName: string;
    windowName?: string;
    command?: string;
    target?: string;
    source?: string;
};
/**
 * Backend execution step for tmux
 */
export type TmuxBackendStep = EnsureSessionStep | ReuseSessionStep | EnsureWindowStep | ReuseWindowStep | SendKeysStep | AttachTargetStep | TailSourceStep;
/**
 * Ensure session exists (create if not exists)
 */
export type EnsureSessionStep = {
    tag: "EnsureSession";
    sessionName: string;
};
/**
 * Reuse existing session
 */
export type ReuseSessionStep = {
    tag: "ReuseSession";
    sessionName: string;
};
/**
 * Ensure window exists in session
 */
export type EnsureWindowStep = {
    tag: "EnsureWindow";
    sessionName: string;
    windowName: string;
};
/**
 * Reuse existing window
 */
export type ReuseWindowStep = {
    tag: "ReuseWindow";
    sessionName: string;
    windowName: string;
};
/**
 * Send keys to pane
 */
export type SendKeysStep = {
    tag: "SendKeys";
    sessionName: string;
    windowName?: string;
    keys: string;
};
/**
 * Attach to target
 */
export type AttachTargetStep = {
    tag: "AttachTarget";
    sessionName: string;
    target: string;
};
/**
 * Tail source in pane
 */
export type TailSourceStep = {
    tag: "TailSource";
    sessionName: string;
    source: string;
};
/**
 * Observation request for tmux backend
 */
export type TmuxObservationRequest = CaptureSessionStateRequest | CaptureWindowStateRequest | CapturePaneOutputRequest;
export type CaptureSessionStateRequest = {
    tag: "CaptureSessionState";
    sessionName: string;
};
export type CaptureWindowStateRequest = {
    tag: "CaptureWindowState";
    sessionName: string;
    windowName?: string;
};
export type CapturePaneOutputRequest = {
    tag: "CapturePaneOutput";
    sessionName: string;
    windowName?: string;
};
/**
 * Complete tmux backend execution plan
 */
export type TmuxBackendPlan = {
    tag: "TmuxBackendPlan";
    steps: TmuxBackendStep[];
    observationPlan: TmuxObservationRequest[];
};
//# sourceMappingURL=tmux-backend.d.ts.map