/**
 * Windows Terminal Backend Execution Tests
 * 
 * Tests for Task 028: Windows Terminal Backend Execution
 * Covers law families W1-W3 from lawbook 060.
 */

import { describe, it, expect } from "vitest";
import {
  buildWtCommand,
  formatWtCommand,
  wslToWindowsPath,
  type WtShellCommand,
} from "../src/backend/wt-command-builder.js";
import { parseModule } from "../src/parser/module-parser.js";

describe("Windows Terminal Backend Execution (W1-W3)", () => {
  describe("W1: Command Structure Laws", () => {
    it("builds wt command with single tab", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "editor" {
              kind "service"
              subject { identity "ed" reference "e1" }
              realizer "Local" "vim"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      const cmd = buildWtCommand(module, { workingDir: "/home/andrey/project" });

      expect(cmd.tag).toBe("wt");
      expect(cmd.args[0]).toBe("new-tab");
      expect(cmd.args).toContain("--title");
      expect(cmd.args).toContain("editor");
    });

    it("builds wt command with multiple tabs", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "editor" {
              kind "service"
              subject { identity "ed" reference "e1" }
              realizer "Local" "vim"
              witness "Process" "running"
            }
            role "server" {
              kind "service"
              subject { identity "srv" reference "s1" }
              realizer "Local" "npm start"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      const cmd = buildWtCommand(module, { workingDir: "/home/andrey/project" });

      // Should have semicolon separator between tabs
      expect(cmd.args).toContain(";");
      
      // Should have two new-tab entries
      const newTabCount = cmd.args.filter(a => a === "new-tab").length;
      expect(newTabCount).toBe(2);
    });

    it("includes wsl command execution", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "editor" {
              kind "service"
              subject { identity "ed" reference "e1" }
              realizer "Local" "vim"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      const cmd = buildWtCommand(module, { workingDir: "/home/andrey" });

      expect(cmd.args).toContain("wsl.exe");
      expect(cmd.args).toContain("vim");
    });
  });

  describe("W2: Path Translation Laws", () => {
    it("converts Unix path to WSL UNC path", () => {
      const unixPath = "/home/andrey/project";
      const windowsPath = wslToWindowsPath(unixPath, "Ubuntu");

      expect(windowsPath).toBe("\\\\wsl$\\Ubuntu\\home\\andrey\\project");
    });

    it("handles root path", () => {
      const unixPath = "/";
      const windowsPath = wslToWindowsPath(unixPath, "Ubuntu");

      expect(windowsPath).toBe("\\\\wsl$\\Ubuntu\\");
    });

    it("handles nested directories", () => {
      const unixPath = "/home/andrey/src/themis";
      const windowsPath = wslToWindowsPath(unixPath, "Ubuntu");

      expect(windowsPath).toBe("\\\\wsl$\\Ubuntu\\home\\andrey\\src\\themis");
    });
  });

  describe("W3: Execution Model Laws", () => {
    it("formats command for display", () => {
      const cmd: WtShellCommand = {
        tag: "wt",
        exePath: "wt.exe",
        args: ["new-tab", "--title", "test"],
        description: "Launch WT",
      };

      const formatted = formatWtCommand(cmd);
      expect(formatted).toBe("wt.exe new-tab --title test");
    });

    it("rejects module with no roles", () => {
      const source = `
        module "empty" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "dummy" {
              kind "service"
              subject { identity "d" reference "d1" }
              realizer "Local" "echo ok"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      // Remove all roles to test the error
      module.workspace.items = [];
      expect(() => buildWtCommand(module)).toThrow(/no roles/);
    });
  });
});
