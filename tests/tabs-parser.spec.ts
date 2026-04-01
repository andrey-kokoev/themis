/**
 * Tabs Parser Tests (Task 029A)
 * 
 * Tests for pane layout surface syntax (lawbook 064A).
 */

import { describe, it, expect } from "vitest";
import { parseTabsModule } from "../src/parser/tabs-parser.js";

describe("Tabs Parser (S1-S4)", () => {
  describe("S1: Tab Extension Laws", () => {
    it("parses minimal tab with single pane", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "editor" in local {
              pane { command "vim" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.moduleId).toBe("test");
      expect(result.workspace.tabs).toHaveLength(1);
      expect(result.workspace.tabs[0]?.name).toBe("editor");
      expect(result.workspace.tabs[0]?.panes).toHaveLength(1);
    });

    it("parses tab with multiple panes", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane { command "vim" }
              pane { command "bash" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.panes).toHaveLength(2);
    });
  });

  describe("S2: Pane Block Laws", () => {
    it("parses pane with horizontal layout", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane horizontal { command "vim" }
              pane horizontal { command "bash" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      const panes = result.workspace.tabs[0]!.panes;
      expect(panes[0]?.layout).toBe("horizontal");
      expect(panes[1]?.layout).toBe("horizontal");
    });

    it("parses pane with vertical layout", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane vertical { command "top" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.panes[0]?.layout).toBe("vertical");
    });

    it("parses pane without command", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane {}
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.panes[0]?.command).toBeUndefined();
    });
  });

  describe("S3: Tab Layout Laws", () => {
    it("defaults to horizontal layout", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane { command "vim" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.layout).toBe("horizontal");
    });

    it("parses explicit horizontal layout", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local layout "horizontal" {
              pane { command "vim" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.layout).toBe("horizontal");
    });

    it("parses explicit vertical layout", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local layout "vertical" {
              pane { command "vim" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs[0]?.layout).toBe("vertical");
    });
  });

  describe("S4: Validation Laws", () => {
    it("parses multiple tabs", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "editor" in local {
              pane { command "vim" }
            }
            tab "server" in local {
              pane { command "npm start" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.workspace.tabs).toHaveLength(2);
      expect(result.workspace.tabs[0]?.name).toBe("editor");
      expect(result.workspace.tabs[1]?.name).toBe("server");
    });

    it("preserves pane order", () => {
      const source = `
        module "test" {
          workspace "main" {
            tab "work" in local {
              pane { command "first" }
              pane { command "second" }
              pane { command "third" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      const panes = result.workspace.tabs[0]!.panes;
      expect(panes[0]?.command).toBe("first");
      expect(panes[1]?.command).toBe("second");
      expect(panes[2]?.command).toBe("third");
    });
  });

  describe("Complex Layouts", () => {
    it("parses mixed layouts", () => {
      const source = `
        module "dev" {
          workspace "main" {
            tab "kimi-work" in local {
              pane horizontal { command "kimi" }
              pane horizontal { command "bash" }
            }
            tab "editor" in local layout "vertical" {
              pane { command "vim" }
              pane { command "npm run dev" }
            }
          }
        }
      `;

      const result = parseTabsModule(source);
      expect(result.moduleId).toBe("dev");
      expect(result.workspace.tabs).toHaveLength(2);
      
      const kimiTab = result.workspace.tabs[0]!;
      expect(kimiTab.name).toBe("kimi-work");
      expect(kimiTab.panes[0]?.layout).toBe("horizontal");
      
      const editorTab = result.workspace.tabs[1]!;
      expect(editorTab.layout).toBe("vertical");
    });
  });
});
