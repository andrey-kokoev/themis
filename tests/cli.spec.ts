/**
 * CLI Operational Semantics Tests
 * 
 * Tests for Task 027: CLI and Operational Deployment
 * Covers law families C1-C4 from lawbook 058.
 */

import { describe, it, expect } from "vitest";
import { parseModule } from "../src/parser/module-parser.js";
import type { SurfaceModule } from "../src/types/surface-module.js";
import type { RoleBlock } from "../src/types/ast.js";
import { buildTmuxCommands, formatTmuxCommand } from "../src/backend/tmux-command-builder.js";
import { checkTmuxSessionExists } from "../src/backend/executor.js";
import type { TmuxBackendPlan, BackendStep } from "../src/types/tmux-backend.js";

describe("CLI Operational Semantics (C1-C4)", () => {
  describe("C1: Invocation Laws", () => {
    it("parses valid runtime DSL module", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Local" "echo test"
              witness "Process" "running"
            }
          }
        }
      `;

      const result = parseModule(source);
      expect(result.moduleId).toBe("test");
      expect(result.workspace).toBeDefined();
    });

    it("rejects module without witness clause", () => {
      const source = `
        module "test" {
          workspace "main" {
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref1" }
              realizer "Local" "echo test"
            }
          }
        }
      `;

      expect(() => parseModule(source)).toThrow(/witness/);
    });
  });

  describe("C2: Pipeline Laws", () => {
    it("extracts roles from workspace items", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "editor" {
              kind "service"
              subject { identity "e1" reference "ed" }
              realizer "Local" "vim"
              witness "Process" "running"
            }
            role "server" {
              kind "service"
              subject { identity "s1" reference "srv" }
              realizer "Local" "npm start"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      const roles = module.workspace.items.filter(
        (item): item is RoleBlock => item.tag === "RoleBlock"
      );

      expect(roles).toHaveLength(2);
      expect(roles[0]?.roleId).toBe("editor");
      expect(roles[1]?.roleId).toBe("server");
    });

    it("maps Local realizer to command", () => {
      const source = `
        module "test" {
          workspace "main" {
            context { "env" "test" }
            persistence "ephemeral"
            equivalence "canonical"
            role "r1" {
              kind "service"
              subject { identity "s1" reference "ref" }
              realizer "Local" "my command"
              witness "Process" "running"
            }
          }
        }
      `;

      const module = parseModule(source);
      const role = module.workspace.items.find(
        (item): item is RoleBlock => item.tag === "RoleBlock"
      );

      expect(role).toBeDefined();
      const localRealizer = role!.realizers.find(r => r.class === "Local");
      expect(localRealizer?.payload).toBe("my command");
    });
  });

  describe("C3: Tmux Command Builder Laws", () => {
    it("builds session creation command", () => {
      const plan: TmuxBackendPlan = {
        tag: "TmuxBackendPlan",
        sessionBinding: "test",
        steps: [
          { tag: "NewSession", sessionName: "test", windowName: "main" },
          { tag: "AttachSession", sessionName: "test" },
        ],
      };

      const commands = buildTmuxCommands(plan);

      expect(commands).toHaveLength(2);
      expect(commands[0]?.args).toEqual([
        "new-session", "-d", "-s", "test", "-n", "main"
      ]);
    });

    it("builds window creation commands for additional roles", () => {
      const plan: TmuxBackendPlan = {
        tag: "TmuxBackendPlan",
        sessionBinding: "test",
        steps: [
          { tag: "NewSession", sessionName: "test", windowName: "first" },
          { tag: "NewWindow", sessionName: "test", windowName: "second" },
          { tag: "AttachSession", sessionName: "test" },
        ],
      };

      const commands = buildTmuxCommands(plan);

      const newWindowCmd = commands.find(c => c.args[0] === "new-window");
      expect(newWindowCmd).toBeDefined();
      expect(newWindowCmd?.args).toEqual([
        "new-window", "-t", "test", "-n", "second"
      ]);
    });

    it("builds send-keys command for Local realizers", () => {
      const plan: TmuxBackendPlan = {
        tag: "TmuxBackendPlan",
        sessionBinding: "test",
        steps: [
          { tag: "NewSession", sessionName: "test", windowName: "main" },
          {
            tag: "SendKeys",
            sessionName: "test",
            windowName: "main",
            command: "echo hello",
          },
          { tag: "AttachSession", sessionName: "test" },
        ],
      };

      const commands = buildTmuxCommands(plan);

      const sendKeysCmd = commands.find(c => c.args[0] === "send-keys");
      expect(sendKeysCmd).toBeDefined();
      expect(sendKeysCmd?.args).toContain("echo hello");
      expect(sendKeysCmd?.args).toContain("C-m");
    });

    it("formats commands for display", () => {
      const cmd = {
        tag: "tmux" as const,
        args: ["new-session", "-d", "-s", "test"],
        description: "Create session",
      };

      const formatted = formatTmuxCommand(cmd);
      expect(formatted).toBe("tmux new-session -d -s test");
    });
  });

  describe("C4: Safety Laws", () => {
    it("checks session existence correctly", async () => {
      // Should return false for non-existent session
      const exists = await checkTmuxSessionExists("definitely-does-not-exist-12345");
      expect(exists).toBe(false);
    });

    it("detects existing sessions", async () => {
      // Create a test session
      const { spawn } = await import("child_process");
      const child = spawn("tmux", ["new-session", "-d", "-s", "test-exists-12345"]);
      await new Promise<void>((resolve) => {
        child.on("close", () => resolve());
      });

      // Should detect it exists
      const exists = await checkTmuxSessionExists("test-exists-12345");
      expect(exists).toBe(true);

      // Cleanup
      spawn("tmux", ["kill-session", "-t", "test-exists-12345"]);
    });
  });
});
