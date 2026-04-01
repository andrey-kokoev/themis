/**
 * WT+WSL Backend Types
 * 
 * Concrete backend realization for Windows Terminal + WSL.
 * Law families W1-W5 from lawbook 042 (Task 019).
 */

// Input types (assumed to exist from profile/policy layers)

/**
 * WT+WSL Action Profile - describes desired terminal action
 */
export type WindowsTerminalWslActionProfile = {
  tag: "WindowsTerminalWslActionProfile";
  actionClass: "command" | "attach" | "tail";
  tabBinding: string;
  command?: string;
  target?: string;
  source?: string;
};

/**
 * WT+WSL Operational Routing Decision - how to execute the action
 */
export type WtWslOperationalDecision = {
  tag: "WtWslOperationalDecision";
  tabDecision: "create-new-tab" | "reuse-existing-tab";
  selectedProfileName?: string;
  selectedDistroName?: string;
  commandArgs?: string[];
};

// Output types (backend realization)

/**
 * Backend execution step
 */
export type BackendStep =
  | LaunchTabStep
  | ReuseTabStep
  | InvokeWslCommandStep
  | AttachTargetStep
  | TailSourceStep;

/**
 * Launch a new tab in Windows Terminal
 */
export type LaunchTabStep = {
  tag: "LaunchTab";
  tabBinding: string;
  profileName?: string;
  distroName?: string;
  command?: string;
};

/**
 * Reuse an existing tab
 */
export type ReuseTabStep = {
  tag: "ReuseTab";
  tabBinding: string;
};

/**
 * Invoke a command via WSL
 */
export type InvokeWslCommandStep = {
  tag: "InvokeWslCommand";
  distroName?: string;
  command: string;
};

/**
 * Attach to a target in a tab
 */
export type AttachTargetStep = {
  tag: "AttachTarget";
  tabBinding: string;
  target: string;
};

/**
 * Tail a source in a tab
 */
export type TailSourceStep = {
  tag: "TailSource";
  tabBinding: string;
  source: string;
};

/**
 * Observation request for backend
 */
export type ObservationRequest =
  | CaptureTabStateRequest
  | CaptureProfileRequest
  | CaptureDistroRequest
  | CaptureCommandResultRequest;

export type CaptureTabStateRequest = {
  tag: "CaptureTabState";
  tabBinding: string;
};

export type CaptureProfileRequest = {
  tag: "CaptureProfile";
  tabBinding: string;
};

export type CaptureDistroRequest = {
  tag: "CaptureDistro";
  tabBinding: string;
};

export type CaptureCommandResultRequest = {
  tag: "CaptureCommandResult";
  tabBinding: string;
};

/**
 * Complete backend execution plan
 */
export type WtWslBackendPlan = {
  tag: "WtWslBackendPlan";
  steps: BackendStep[];
  observationPlan: ObservationRequest[];
};
