/**
 * Tmux Concrete Backend Realization
 *
 * Implements lawbook 044 (Task 020).
 * Transforms tmux profile into executable backend plan.
 */
/**
 * Realize tmux backend plan from profile.
 *
 * Law T1: Consumes existing profile semantics
 * Law T2: Action class mapping (command/attach/tail)
 * Law T3: Session/window naming constraints
 * Law T4: Observation boundary
 * Law T5: Non-judgment (no semantic verdicts)
 */
export function realizeTmuxBackend(profile) {
    const steps = [];
    const observationPlan = [];
    // Step 1: Session handling
    // Law T1: Ensure session exists
    steps.push({
        tag: "EnsureSession",
        sessionName: profile.sessionName,
    });
    // Step 2: Window handling (if window name specified)
    if (profile.windowName) {
        steps.push({
            tag: "EnsureWindow",
            sessionName: profile.sessionName,
            windowName: profile.windowName,
        });
    }
    // Step 3: Action-class specific steps
    // Law T2: Action mapping
    switch (profile.actionClass) {
        case "command":
            // command → SendKeys
            if (profile.command) {
                steps.push({
                    tag: "SendKeys",
                    sessionName: profile.sessionName,
                    windowName: profile.windowName,
                    keys: profile.command,
                });
            }
            // Observation for pane output
            observationPlan.push({
                tag: "CapturePaneOutput",
                sessionName: profile.sessionName,
                windowName: profile.windowName,
            });
            break;
        case "attach":
            // attach → AttachTarget
            if (profile.target) {
                steps.push({
                    tag: "AttachTarget",
                    sessionName: profile.sessionName,
                    target: profile.target,
                });
            }
            break;
        case "tail":
            // tail → TailSource
            if (profile.source) {
                steps.push({
                    tag: "TailSource",
                    sessionName: profile.sessionName,
                    source: profile.source,
                });
            }
            // Also capture output for tail
            observationPlan.push({
                tag: "CapturePaneOutput",
                sessionName: profile.sessionName,
                windowName: profile.windowName,
            });
            break;
    }
    // Step 4: Observation plan
    // Law T4: Observation within admitted boundary
    observationPlan.push({
        tag: "CaptureSessionState",
        sessionName: profile.sessionName,
    });
    if (profile.windowName) {
        observationPlan.push({
            tag: "CaptureWindowState",
            sessionName: profile.sessionName,
            windowName: profile.windowName,
        });
    }
    return {
        tag: "TmuxBackendPlan",
        steps,
        observationPlan,
    };
}
/**
 * Validate that backend plan contains no semantic judgment.
 *
 * Law T5: Backend must not emit semantic verdicts
 */
export function containsNoSemanticJudgment(plan) {
    const forbiddenFields = [
        "satisfied",
        "admissible",
        "conflict",
        "verdict",
        "acknowledged",
    ];
    for (const step of plan.steps) {
        const stepStr = JSON.stringify(step).toLowerCase();
        for (const field of forbiddenFields) {
            if (stepStr.includes(field)) {
                return false;
            }
        }
    }
    return true;
}
/**
 * Check backend plan determinism.
 *
 * Same input must yield same plan.
 */
export function isDeterministic(profile) {
    const plan1 = JSON.stringify(realizeTmuxBackend(profile));
    const plan2 = JSON.stringify(realizeTmuxBackend(profile));
    return plan1 === plan2;
}
//# sourceMappingURL=tmux-realization.js.map