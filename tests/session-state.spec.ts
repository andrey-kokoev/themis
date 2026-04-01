/**
 * Session State Persistence Tests (Task 029D)
 * 
 * Tests for save/restore functionality (lawbook 064D).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  saveState,
  loadState,
  stateToModule,
  getStatePath,
  type StateFile,
} from "../src/state/session-state.js";
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

describe("Session State Persistence (P1-P5)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "themis-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("P1: State File Laws", () => {
    it("saves with correct schema version", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);

      const content = loadState(statePath);
      expect(content.version).toBe("1");
    });

    it("captures module identifier", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);

      const content = loadState(statePath);
      expect(content.module).toBe("test");
    });

    it("captures backend type", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "wt", statePath);

      const content = loadState(statePath);
      expect(content.session.backend).toBe("wt");
    });

    it("includes creation timestamp", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);

      const content = loadState(statePath);
      expect(content.created).toBeDefined();
      expect(new Date(content.created).getTime()).toBeGreaterThan(0);
    });
  });

  describe("P2: Save Operation Laws", () => {
    it("creates state file on save", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);

      expect(existsSync(statePath)).toBe(true);
    });

    it("captures declared state from module", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);

      const content = loadState(statePath);
      expect(content.source).toBe("declared");
      expect(content.session.tabs).toHaveLength(1);
      expect(content.session.tabs[0]?.panes).toHaveLength(2);
    });
  });

  describe("P3: Restore Operation Laws", () => {
    it("loads state and converts to module", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);
      const loaded = loadState(statePath);
      const restored = stateToModule(loaded);

      expect(restored.moduleId).toBe("test");
      expect(restored.workspace.tabs).toHaveLength(1);
    });

    it("throws error for missing state file", () => {
      const statePath = join(tempDir, "nonexistent.state.json");

      expect(() => loadState(statePath)).toThrow(/not found/);
    });

    it("preserves pane commands in restore", () => {
      const module = createTestModule();
      const statePath = join(tempDir, "test.state.json");

      saveState(module, "tmux", statePath);
      const loaded = loadState(statePath);
      const restored = stateToModule(loaded);

      const panes = restored.workspace.tabs[0]!.panes;
      expect(panes[0]?.command).toBe("vim");
      expect(panes[1]?.command).toBe("bash");
    });
  });

  describe("P4: State Schema", () => {
    it("serializes tab structure correctly", () => {
      const module: TabbedModule = {
        tag: "TabbedModule",
        moduleId: "complex",
        imports: [],
        workspace: {
          tag: "TabWorkspace",
      pipes: [],
          name: "main",
          tabs: [
            {
              tag: "TabBlock",
              name: "editor",
              target: "local",
              layout: "vertical",
              panes: [{ tag: "PaneBlock", command: "vim" }],
            },
            {
              tag: "TabBlock",
              name: "server",
              target: "local",
              layout: "horizontal",
              panes: [
                { tag: "PaneBlock", command: "npm start" },
                { tag: "PaneBlock", command: "npm run watch" },
              ],
            },
          ],
        },
      };

      const statePath = join(tempDir, "complex.state.json");
      saveState(module, "tmux", statePath);
      const loaded = loadState(statePath);

      expect(loaded.session.tabs).toHaveLength(2);
      expect(loaded.session.tabs[0]?.name).toBe("editor");
      expect(loaded.session.tabs[1]?.name).toBe("server");
    });
  });

  describe("P5: Cross-Version Laws", () => {
    it("accepts current version", () => {
      const validState: StateFile = {
        version: "1",
        module: "test",
        created: new Date().toISOString(),
        source: "declared",
        session: {
          name: "test",
          backend: "tmux",
          tabs: [],
        },
      };

      const statePath = join(tempDir, "version-test.state.json");
      const { writeFileSync } = require("fs");
      writeFileSync(statePath, JSON.stringify(validState), "utf-8");

      expect(() => loadState(statePath)).not.toThrow();
    });

    it("rejects newer unknown version", () => {
      const futureState: StateFile = {
        version: "99",
        module: "test",
        created: new Date().toISOString(),
        source: "declared",
        session: {
          name: "test",
          backend: "tmux",
          tabs: [],
        },
      };

      const statePath = join(tempDir, "future-test.state.json");
      const { writeFileSync } = require("fs");
      writeFileSync(statePath, JSON.stringify(futureState), "utf-8");

      expect(() => loadState(statePath)).toThrow(/version 99 is newer/);
    });
  });

  describe("Utility Functions", () => {
    it("computes state path from module path", () => {
      expect(getStatePath("/home/andrey/dev.themis")).toBe("/home/andrey/dev.themis.state.json");
      expect(getStatePath("project.themis")).toBe("project.themis.state.json");
    });
  });
});
