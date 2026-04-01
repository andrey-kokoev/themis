/**
 * Backend Executor
 * 
 * Implements lawbook 058 (C2, C4).
 * Executes shell commands for tmux and Windows Terminal.
 */

import { spawn, exec } from "child_process";
import { promisify } from "util";
import type { TmuxShellCommand } from "./tmux-command-builder.js";

const execAsync = promisify(exec);

/**
 * Execution result.
 */
export type ExecutionResult = {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: Error;
};

/**
 * Execute a tmux command.
 * 
 * Law C2.2: Error propagation
 * Law C4.1: Session exists check
 */
export async function executeTmuxCommand(
  cmd: TmuxShellCommand
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const child = spawn("tmux", cmd.args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        success: code === 0,
        exitCode: code ?? -1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    child.on("error", (error) => {
      resolve({
        success: false,
        exitCode: -1,
        stdout,
        stderr,
        error,
      });
    });
  });
}

/**
 * Check if tmux session exists.
 * 
 * Law C4.1: Returns true if session exists.
 */
export async function checkTmuxSessionExists(sessionName: string): Promise<boolean> {
  try {
    const { exitCode } = await executeTmuxCommand({
      tag: "tmux",
      args: ["has-session", "-t", sessionName],
      description: `Check session '${sessionName}'`,
    });
    return exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Execute multiple tmux commands in sequence.
 * 
 * Law C2.1: Pipeline execution
 * Law C2.2: Stop on first failure
 */
export async function executeTmuxSequence(
  commands: TmuxShellCommand[],
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<ExecutionResult> {
  const { dryRun = false, verbose = false } = options;

  for (const cmd of commands) {
    if (verbose || dryRun) {
      console.log(`$ tmux ${cmd.args.join(" ")}`);
      console.log(`  # ${cmd.description}`);
    }

    if (dryRun) {
      continue;
    }

    const result = await executeTmuxCommand(cmd);

    if (!result.success) {
      // Check for "session exists" error
      if (result.stderr.includes("session already exists")) {
        return {
          success: false,
          exitCode: 1,
          stdout: result.stdout,
          stderr: `Session already exists. Use 'tmux attach -t ${cmd.args[cmd.args.indexOf("-s") + 1]}' or choose a different module name.`,
        };
      }

      return result;
    }
  }

  return {
    success: true,
    exitCode: 0,
    stdout: "",
    stderr: "",
  };
}

/**
 * Execute Windows Terminal command.
 * 
 * Law W3: Fire and forget execution.
 */
export async function executeWtCommand(
  wtPath: string,
  args: string[]
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // WT runs in Windows, use shell to handle semicolon separators
    // The semicolons are WT syntax, not shell syntax, so we need to escape them properly
    const child = spawn(wtPath, args, {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: false,
      shell: false, // Don't use shell - pass args directly
    });

    // WT detaches immediately, consider success if spawn works
    child.on("spawn", () => {
      resolve({
        success: true,
        exitCode: 0,
        stdout: "",
        stderr: "",
      });
    });

    child.on("error", (error) => {
      // Common error: wt.exe not found
      const errorMsg = error.message.includes("ENOENT")
        ? `Windows Terminal not found at '${wtPath}'. Is it installed and in PATH?`
        : error.message;
      
      resolve({
        success: false,
        exitCode: -1,
        stdout: "",
        stderr: errorMsg,
        error,
      });
    });
  });
}

/**
 * Check if Windows Terminal is available.
 */
export async function checkWtAvailable(wtPath: string = "wt.exe"): Promise<boolean> {
  try {
    const { spawn } = await import("child_process");
    return new Promise((resolve) => {
      const child = spawn("which", [wtPath], { stdio: "ignore" });
      child.on("close", (code) => resolve(code === 0));
      child.on("error", () => resolve(false));
    });
  } catch {
    return false;
  }
}
