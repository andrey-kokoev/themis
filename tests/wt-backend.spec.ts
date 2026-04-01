/**
 * Windows Terminal Backend Tests
 * 
 * Tests for Task 028: Windows Terminal Backend Execution
 * Covers law families W1-W3 from lawbook 060.
 */

import { describe, it, expect } from "vitest";
import { buildWtPaneCommand, formatWtCommand } from "../src/backend/wt-pane-builder.js";
import type { TabbedModule } from "../src/types/tabs.js";

describe("Windows Terminal Backend (W1-W5)", () => {
  describe("W1: Split Command Laws", () => {
    it("uses new-tab for first pane", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "horizontal",
            panes: [{ tag: "PaneBlock", command: "bash" }],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args[0]).toBe("new-tab");
    });

    it("uses split-pane for additional panes", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "horizontal",
            panes: [
              { tag: "PaneBlock" },
              { tag: "PaneBlock" },
            ],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain("split-pane");
    });

    it("uses --horizontal for horizontal layout", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "horizontal",
            panes: [
              { tag: "PaneBlock" },
              { tag: "PaneBlock", layout: "horizontal" },
            ],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain("--horizontal");
    });

    it("uses --vertical for vertical layout", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "vertical",
            panes: [
              { tag: "PaneBlock" },
              { tag: "PaneBlock", layout: "vertical" },
            ],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain("--vertical");
    });
  });

  describe("W2: Sequence Laws", () => {
    it("single invocation with semicolon separators", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "horizontal",
            panes: [
              { tag: "PaneBlock" },
              { tag: "PaneBlock" },
            ],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain(";");
    });
  });

  describe("W3: Command Association", () => {
    it("includes command in first pane", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "test",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [{
            tag: "TabBlock",
            name: "main",
            target: "local",
            layout: "horizontal",
            panes: [{ tag: "PaneBlock", command: "vim" }],
          }],
          pipes: [],
        },
      };

      const cmd = buildWtPaneCommand(module);
      expect(cmd.args).toContain("vim");
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
