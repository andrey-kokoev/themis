/**
 * Windows Terminal Pane Backend Tests (Task 029C)
 * 
 * Tests for WT pane execution (lawbook 064C).
 */

import { describe, it, expect } from "vitest";
import { buildWtPaneCommand, formatWtCommand } from "../src/backend/wt-pane-builder.js";
import type { TabbedModule } from "../src/types/tabs.js";

function createTestModule(): TabbedModule {
  return {
    tag: "TabbedModule",
    moduleId: "test",
    imports: [],
    workspace: {
      tag: "TabWorkspace",
      pipes: [],
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
    },
  };
}

describe("Windows Terminal Pane Backend (W1-W5)", () => {
  describe("W1: Split Command Laws", () => {
    it("uses new-tab for first pane", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args[0]).toBe("new-tab");
    });

    it("uses split-pane for additional panes", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args).toContain("split-pane");
    });

    it("uses --horizontal for horizontal layout", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args).toContain("--horizontal");
    });

    it("uses --vertical for vertical layout", () => {
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

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain("--vertical");
    });
  });

  describe("W2: Sequence Laws", () => {
    it("single invocation with semicolon separators", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args).toContain(";");
    });

    it("new-tab before split-pane", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      const newTabIdx = cmd.args.indexOf("new-tab");
      const splitIdx = cmd.args.indexOf("split-pane");

      expect(newTabIdx).toBeLessThan(splitIdx);
    });
  });

  describe("W3: Layout Mapping", () => {
    it("maps horizontal to --horizontal", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      const splitIdx = cmd.args.indexOf("split-pane");
      expect(cmd.args[splitIdx + 1]).toBe("--horizontal");
    });

    it("maps vertical to --vertical", () => {
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

      const cmd = buildWtPaneCommand(module);
      const splitIdx = cmd.args.indexOf("split-pane");
      expect(cmd.args[splitIdx + 1]).toBe("--vertical");
    });
  });

  describe("W4: Command Association", () => {
    it("includes command in first pane", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args).toContain("vim");
    });

    it("includes command in split pane", () => {
      const module = createTestModule();
      const cmd = buildWtPaneCommand(module);

      expect(cmd.args).toContain("bash");
    });
  });

  describe("W5: Command Formatting", () => {
    it("formats command for display", () => {
      const cmd = {
        tag: "wt" as const,
        exePath: "wt.exe",
        args: ["new-tab", "--title", "test"],
        description: "Launch WT",
      };

      const formatted = formatWtCommand(cmd);
      expect(formatted).toBe("wt.exe new-tab --title test");
    });
  });
});
