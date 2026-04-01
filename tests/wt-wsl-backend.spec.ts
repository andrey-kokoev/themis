/**
 * WT+WSL Concrete Backend Realization Tests
 * 
 * Tests for Task 019: WT+WSL Concrete Backend Realization
 * Covers law families W1-W6 from lawbook 042.
 */

import { describe, it, expect } from "vitest";
import {
  realizeWtWslBackend,
  containsNoSemanticJudgment,
  isDeterministic,
} from "../src/backend/wt-wsl-realization.js";
import type {
  WindowsTerminalWslActionProfile,
  WtWslOperationalDecision,
} from "../src/types/wt-wsl-backend.js";

describe("WT+WSL Backend Realization (W1-W6)", () => {
  describe("W1: Policy Consumption Laws", () => {
    it("create-new-tab emits LaunchTab", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls -la",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("LaunchTab");
      expect(plan.steps[0].tabBinding).toBe("tab1");
    });

    it("reuse-existing-tab emits ReuseTab", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "reuse-existing-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("ReuseTab");
      expect(plan.steps[0].tabBinding).toBe("tab1");
    });

    it("backend does not alter tabDecision semantics", () => {
      // The backend should faithfully execute the decision
      // without adding its own logic
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "echo test",
      };

      // Test create
      const createDecision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };
      const createPlan = realizeWtWslBackend(profile, createDecision);
      expect(createPlan.steps.some(s => s.tag === "LaunchTab")).toBe(true);
      expect(createPlan.steps.some(s => s.tag === "ReuseTab")).toBe(false);

      // Test reuse
      const reuseDecision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "reuse-existing-tab",
      };
      const reusePlan = realizeWtWslBackend(profile, reuseDecision);
      expect(reusePlan.steps.some(s => s.tag === "ReuseTab")).toBe(true);
      expect(reusePlan.steps.some(s => s.tag === "LaunchTab")).toBe(false);
    });
  });

  describe("W2: Action Mapping Laws", () => {
    it("command emits LaunchTab + InvokeWslCommand", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls -la",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("LaunchTab");
      expect(plan.steps[1].tag).toBe("InvokeWslCommand");
      expect(plan.steps[1].command).toBe("ls -la");
    });

    it("reuse-existing-tab command emits ReuseTab + InvokeWslCommand", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "pwd",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "reuse-existing-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("ReuseTab");
      expect(plan.steps[1].tag).toBe("InvokeWslCommand");
    });

    it("attach emits AttachTarget and not InvokeWslCommand", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "attach",
        tabBinding: "tab1",
        target: "/dev/ttyUSB0",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("LaunchTab");
      expect(plan.steps[1].tag).toBe("AttachTarget");
      expect(plan.steps[1].target).toBe("/dev/ttyUSB0");
      expect(plan.steps.some(s => s.tag === "InvokeWslCommand")).toBe(false);
    });

    it("tail emits TailSource and not InvokeWslCommand", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "tail",
        tabBinding: "tab1",
        source: "/var/log/syslog",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.steps[0].tag).toBe("LaunchTab");
      expect(plan.steps[1].tag).toBe("TailSource");
      expect(plan.steps[1].source).toBe("/var/log/syslog");
      expect(plan.steps.some(s => s.tag === "InvokeWslCommand")).toBe(false);
    });
  });

  describe("W3: Selector Explicitness Laws", () => {
    it("absent profile/distro remain absent in backend plan", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
        // No selectedProfileName or selectedDistroName
      };

      const plan = realizeWtWslBackend(profile, decision);

      const launchStep = plan.steps.find(s => s.tag === "LaunchTab");
      expect(launchStep).toBeDefined();
      expect(launchStep!.profileName).toBeUndefined();
      expect(launchStep!.distroName).toBeUndefined();
    });

    it("explicit profile/distro are propagated unchanged", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
        selectedProfileName: "Ubuntu",
        selectedDistroName: "Ubuntu-22.04",
      };

      const plan = realizeWtWslBackend(profile, decision);

      const launchStep = plan.steps.find(s => s.tag === "LaunchTab");
      expect(launchStep!.profileName).toBe("Ubuntu");
      expect(launchStep!.distroName).toBe("Ubuntu-22.04");
    });
  });

  describe("W4: Observation Boundary Laws", () => {
    it("observation plan stays within admitted request set", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
        selectedProfileName: "Ubuntu",
        selectedDistroName: "Ubuntu-22.04",
      };

      const plan = realizeWtWslBackend(profile, decision);

      // All observations should be from the admitted set
      const admittedTags = [
        "CaptureTabState",
        "CaptureProfile",
        "CaptureDistro",
        "CaptureCommandResult",
      ];

      for (const obs of plan.observationPlan) {
        expect(admittedTags).toContain(obs.tag);
      }
    });

    it("command includes CaptureCommandResult observation", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.observationPlan.some(o => o.tag === "CaptureCommandResult")).toBe(true);
    });

    it("all plans include CaptureTabState observation", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "attach",
        tabBinding: "tab1",
        target: "target",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(plan.observationPlan.some(o => o.tag === "CaptureTabState")).toBe(true);
    });
  });

  describe("W5: Non-Judgment Laws", () => {
    it("backend plan contains no semantic verdict fields", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      expect(containsNoSemanticJudgment(plan)).toBe(true);
    });

    it("backend steps are purely operational", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
      };

      const plan = realizeWtWslBackend(profile, decision);

      // All steps should be operational commands
      const operationalTags = [
        "LaunchTab",
        "ReuseTab",
        "InvokeWslCommand",
        "AttachTarget",
        "TailSource",
      ];

      for (const step of plan.steps) {
        expect(operationalTags).toContain(step.tag);
      }
    });
  });

  describe("W6: Determinism Laws", () => {
    it("same input yields same backend plan", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "command",
        tabBinding: "tab1",
        command: "ls -la",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "create-new-tab",
        selectedProfileName: "Ubuntu",
      };

      const plan1 = realizeWtWslBackend(profile, decision);
      const plan2 = realizeWtWslBackend(profile, decision);

      expect(plan1).toEqual(plan2);
    });

    it("isDeterministic helper returns true for valid inputs", () => {
      const profile: WindowsTerminalWslActionProfile = {
        tag: "WindowsTerminalWslActionProfile",
        actionClass: "tail",
        tabBinding: "tab1",
        source: "/var/log/messages",
      };
      const decision: WtWslOperationalDecision = {
        tag: "WtWslOperationalDecision",
        tabDecision: "reuse-existing-tab",
      };

      expect(isDeterministic(profile, decision)).toBe(true);
    });
  });
});
