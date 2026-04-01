/**
 * WT+WSL Concrete Backend Realization
 * 
 * Implements lawbook 042 (Task 019).
 * Transforms WT+WSL profile and routing decision into executable backend plan.
 */

import type {
  WindowsTerminalWslActionProfile,
  WtWslOperationalDecision,
  WtWslBackendPlan,
  BackendStep,
  ObservationRequest,
} from "../types/wt-wsl-backend.js";

/**
 * Realize WT+WSL backend plan from profile and routing decision.
 * 
 * Law W1: Consumes existing profile/policy outputs
 * Law W2: Action class mapping (command/attach/tail)
 * Law W3: Selector explicitness (profile/distro)
 * Law W4: Observation boundary
 * Law W5: Non-judgment (no semantic verdicts)
 */
export function realizeWtWslBackend(
  profile: WindowsTerminalWslActionProfile,
  decision: WtWslOperationalDecision
): WtWslBackendPlan {
  const steps: BackendStep[] = [];
  const observationPlan: ObservationRequest[] = [];

  // Step 1: Tab handling (create or reuse)
  // Law W1: Backend consumes routing decision, doesn't re-decide
  if (decision.tabDecision === "create-new-tab") {
    // Law W2: LaunchTab for new tabs
    steps.push({
      tag: "LaunchTab",
      tabBinding: profile.tabBinding,
      profileName: decision.selectedProfileName,
      distroName: decision.selectedDistroName,
    });
  } else {
    // decision.tabDecision === "reuse-existing-tab"
    steps.push({
      tag: "ReuseTab",
      tabBinding: profile.tabBinding,
    });
  }

  // Step 2: Action-class specific steps
  // Law W2: Action mapping
  switch (profile.actionClass) {
    case "command":
      // command → InvokeWslCommand
      if (profile.command) {
        steps.push({
          tag: "InvokeWslCommand",
          distroName: decision.selectedDistroName,
          command: profile.command,
        });
      }
      // Observation for command result
      observationPlan.push({
        tag: "CaptureCommandResult",
        tabBinding: profile.tabBinding,
      });
      break;

    case "attach":
      // attach → AttachTarget
      if (profile.target) {
        steps.push({
          tag: "AttachTarget",
          tabBinding: profile.tabBinding,
          target: profile.target,
        });
      }
      break;

    case "tail":
      // tail → TailSource
      if (profile.source) {
        steps.push({
          tag: "TailSource",
          tabBinding: profile.tabBinding,
          source: profile.source,
        });
      }
      break;
  }

  // Step 3: Observation plan
  // Law W4: Observation within admitted boundary
  observationPlan.push(
    { tag: "CaptureTabState", tabBinding: profile.tabBinding }
  );

  // Include profile/distro capture if explicitly selected
  if (decision.selectedProfileName) {
    observationPlan.push({
      tag: "CaptureProfile",
      tabBinding: profile.tabBinding,
    });
  }
  if (decision.selectedDistroName) {
    observationPlan.push({
      tag: "CaptureDistro",
      tabBinding: profile.tabBinding,
    });
  }

  return {
    tag: "WtWslBackendPlan",
    steps,
    observationPlan,
  };
}

/**
 * Validate that backend plan contains no semantic judgment.
 * 
 * Law W5: Backend must not emit semantic verdicts
 */
export function containsNoSemanticJudgment(plan: WtWslBackendPlan): boolean {
  // Check that no step contains fields like:
  // - satisfied, admissible, conflict, etc.
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
export function isDeterministic(
  profile: WindowsTerminalWslActionProfile,
  decision: WtWslOperationalDecision
): boolean {
  const plan1 = JSON.stringify(realizeWtWslBackend(profile, decision));
  const plan2 = JSON.stringify(realizeWtWslBackend(profile, decision));
  return plan1 === plan2;
}
