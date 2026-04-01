/**
 * Tmux Concrete Backend Realization Tests
 * 
 * Tests for Task 020: Tmux Concrete Backend Realization
 * Covers law families T1-T6 from lawbook 044.
 */

import { describe, it, expect } from "vitest";
import {
  realizeTmuxBackend,
  containsNoSemanticJudgment,
  isDeterministic,
} from "../src/backend/tmux-realization.js";
import type { TmuxActionProfile } from "../src/types/tmux-backend.js";

describe("Tmux Backend Realization (T1-T6)", () => {
  describe("T1: Profile Consumption Laws", () => {
    it("consumes session name from profile", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "my-session",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      const ensureStep = plan.steps.find(s => s.tag === "EnsureSession");
      expect(ensureStep).toBeDefined();
      expect(ensureStep!.sessionName).toBe("my-session");
    });

    it("consumes window name from profile when specified", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "my-session",
        windowName: "my-window",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      const windowStep = plan.steps.find(s => s.tag === "EnsureWindow");
      expect(windowStep).toBeDefined();
      expect(windowStep!.windowName).toBe("my-window");
    });
  });

  describe("T2: Action Mapping Laws", () => {
    it("command emits EnsureSession + SendKeys", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        command: "ls -la",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps[0].tag).toBe("EnsureSession");
      expect(plan.steps[1].tag).toBe("SendKeys");
      expect(plan.steps[1].keys).toBe("ls -la");
    });

    it("command with window emits EnsureSession + EnsureWindow + SendKeys", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        windowName: "window1",
        command: "pwd",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps[0].tag).toBe("EnsureSession");
      expect(plan.steps[1].tag).toBe("EnsureWindow");
      expect(plan.steps[2].tag).toBe("SendKeys");
    });

    it("attach emits AttachTarget", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "attach",
        sessionName: "session1",
        target: "/dev/ttyUSB0",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps[0].tag).toBe("EnsureSession");
      const attachStep = plan.steps.find(s => s.tag === "AttachTarget");
      expect(attachStep).toBeDefined();
      expect(attachStep!.target).toBe("/dev/ttyUSB0");
    });

    it("attach does not emit SendKeys", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "attach",
        sessionName: "session1",
        target: "target1",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps.some(s => s.tag === "SendKeys")).toBe(false);
    });

    it("tail emits TailSource", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "tail",
        sessionName: "session1",
        source: "/var/log/syslog",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps[0].tag).toBe("EnsureSession");
      const tailStep = plan.steps.find(s => s.tag === "TailSource");
      expect(tailStep).toBeDefined();
      expect(tailStep!.source).toBe("/var/log/syslog");
    });

    it("tail does not emit SendKeys", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "tail",
        sessionName: "session1",
        source: "/var/log/messages",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.steps.some(s => s.tag === "SendKeys")).toBe(false);
    });
  });

  describe("T3: Naming Constraint Laws", () => {
    it("preserves session name unchanged", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "complex-session-name-123",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      const sessionStep = plan.steps.find(s => s.tag === "EnsureSession");
      expect(sessionStep!.sessionName).toBe("complex-session-name-123");
    });

    it("preserves window name unchanged", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        windowName: "window-with-dashes-456",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      const windowStep = plan.steps.find(s => s.tag === "EnsureWindow");
      expect(windowStep!.windowName).toBe("window-with-dashes-456");
    });
  });

  describe("T4: Observation Boundary Laws", () => {
    it("includes CaptureSessionState observation", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.observationPlan.some(o => o.tag === "CaptureSessionState")).toBe(true);
    });

    it("includes CaptureWindowState when window specified", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        windowName: "window1",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.observationPlan.some(o => o.tag === "CaptureWindowState")).toBe(true);
    });

    it("includes CapturePaneOutput for command actions", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      expect(plan.observationPlan.some(o => o.tag === "CapturePaneOutput")).toBe(true);
    });

    it("observations stay within admitted set", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "tail",
        sessionName: "session1",
        source: "/var/log/messages",
      };

      const plan = realizeTmuxBackend(profile);

      const admittedTags = [
        "CaptureSessionState",
        "CaptureWindowState",
        "CapturePaneOutput",
      ];

      for (const obs of plan.observationPlan) {
        expect(admittedTags).toContain(obs.tag);
      }
    });
  });

  describe("T5: Non-Judgment Laws", () => {
    it("backend plan contains no semantic verdict fields", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        command: "ls",
      };

      const plan = realizeTmuxBackend(profile);

      expect(containsNoSemanticJudgment(plan)).toBe(true);
    });

    it("all steps are operational", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "attach",
        sessionName: "session1",
        target: "target1",
      };

      const plan = realizeTmuxBackend(profile);

      const operationalTags = [
        "EnsureSession",
        "ReuseSession",
        "EnsureWindow",
        "ReuseWindow",
        "SendKeys",
        "AttachTarget",
        "TailSource",
      ];

      for (const step of plan.steps) {
        expect(operationalTags).toContain(step.tag);
      }
    });
  });

  describe("T6: Determinism Laws", () => {
    it("same input yields same backend plan", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "command",
        sessionName: "session1",
        windowName: "window1",
        command: "ls -la",
      };

      const plan1 = realizeTmuxBackend(profile);
      const plan2 = realizeTmuxBackend(profile);

      expect(plan1).toEqual(plan2);
    });

    it("isDeterministic helper returns true", () => {
      const profile: TmuxActionProfile = {
        tag: "TmuxActionProfile",
        actionClass: "tail",
        sessionName: "session1",
        source: "/var/log/messages",
      };

      expect(isDeterministic(profile)).toBe(true);
    });
  });
});
