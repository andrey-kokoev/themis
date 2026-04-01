/**
 * Tmux Pane Backend Tests (Task 029B)
 * 
 * Tests for tmux pane execution (lawbook 064B).
 */

import { describe, it, expect } from "vitest";
import { buildTmuxPaneCommands, formatTmuxCommand } from "../src/backend/tmux-pane-builder.js";
import type { TabbedModule } from "../src/types/tabs.js";

function createTestModule(): TabbedModule {
  return {
    tag: "TabbedModule",
    moduleId: "test",
    imports: [],
    workspace: {
      tag: "TabWorkspace",
      name: "main",
      tabs: [
        {
          tag: "TabBlock",
          name: "work",
          target: "local",
          layout: "horizontal",
          panes: [
            { tag: "PaneBlock", layout: "horizontal", command: "vim" },
            { tag: "PaneBlock", layout: "horizontal", command: "bash" },
          ],
        },
      ],
      pipes: [],
    },
  };
}

describe("Tmux Pane Backend (T1-T4)", () => {
  describe("T1: Split Command Laws", () => {
    it("creates session for first tab", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const newSession = commands.find(c => c.tag === "tmux" && c.args[0] === "new-session");
      expect(newSession).toBeDefined();
      expect(newSession?.args).toContain("test");
    });

    it("splits horizontally with -h flag", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const split = commands.find(c => c.args[0] === "split-window");
      expect(split).toBeDefined();
      expect(split?.args).toContain("-h");
    });

    it("splits vertically with -v flag", () => {
      const module: TabbedModule = {
        ...createTestModule(),
        workspace: {
          ...createTestModule().workspace,
          tabs: [{
            ...createTestModule().workspace.tabs[0]!,
            panes: [
              { tag: "PaneBlock", layout: "vertical", command: "top" },
              { tag: "PaneBlock", layout: "vertical", command: "watch" },
            ],
          }],
        },
      };

      const commands = buildTmuxPaneCommands(module);
      const split = commands.find(c => c.args[0] === "split-window");
      expect(split?.args).toContain("-v");
    });
  });

  describe("T2: Sequence Laws", () => {
    it("creates window before splits", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const newWindowIdx = commands.findIndex(c => c.args[0] === "new-window");
      const splitIdx = commands.findIndex(c => c.args[0] === "split-window");

      expect(newWindowIdx).toBeLessThan(splitIdx);
    });

    it("sends commands after all splits", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const lastSplitIdx = commands.map(c => c.args[0]).lastIndexOf("split-window");
      const firstSendIdx = commands.findIndex(c => c.args[0] === "send-keys");

      expect(firstSendIdx).toBeGreaterThan(lastSplitIdx);
    });

    it("targets correct pane indices", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const split = commands.find(c => c.args[0] === "split-window");
      expect(split?.args).toContain("test:work.0");

      const sends = commands.filter(c => c.args[0] === "send-keys");
      expect(sends[0]?.args).toContain("test:work.0");
      expect(sends[1]?.args).toContain("test:work.1");
    });
  });

  describe("T3: Layout Mapping", () => {
    it("maps horizontal to -h", () => {
      const module = createTestModule();
      const commands = buildTmuxPaneCommands(module);

      const split = commands.find(c => c.args[0] === "split-window");
      expect(split?.args[1]).toBe("-h");
    });

    it("maps vertical to -v", () => {
      const module: TabbedModule = {
        ...createTestModule(),
        workspace: {
          ...createTestModule().workspace,
          tabs: [{
            ...createTestModule().workspace.tabs[0]!,
            layout: "vertical",
            panes: [
              { tag: "PaneBlock", command: "a" },
              { tag: "PaneBlock", command: "b" },
            ],
          }],
        },
      };

      const commands = buildTmuxPaneCommands(module);
      const split = commands.find(c => c.args[0] === "split-window");
      expect(split?.args[1]).toBe("-v");
    });
  });

  describe("T4: Command Formatting", () => {
    it("formats commands for display", () => {
      const cmd = {
        tag: "tmux" as const,
        args: ["new-window", "-t", "test", "-n", "work"],
        description: "Create window",
      };

      const formatted = formatTmuxCommand(cmd);
      expect(formatted).toBe("$ tmux new-window -t test -n work");
    });
  });
});
