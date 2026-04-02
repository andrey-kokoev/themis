/**
 * Backend Executor
 * 
 * Implements lawbook 058 (C2, C4).
 * Executes shell commands for tmux and Windows Terminal.
 */

import { spawn, exec } from "child_process";
import { promisify } from "util";
import { rm } from "fs/promises";
import type { TmuxShellCommand } from "./tmux-command-builder.js";
import type { WtShellCommand } from "./wt-pane-builder.js";

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
 * Cleans up temp files after launching.
 */
export async function executeWtCommand(cmd: WtShellCommand): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // On Windows, we need to build a proper command line string
    // because Windows doesn't have argv array - it parses a single command line
    const cmdLine = buildWindowsCommandLine(cmd.exePath, cmd.args);
    
    const child = spawn(cmdLine, [], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: false,
      shell: true, // Use shell to properly handle the command line
    });

    // WT detaches immediately, consider success if spawn works
    child.on("spawn", () => {
      // Clean up temp files after a short delay (scripts need time to start)
      setTimeout(() => {
        cleanupTempFiles(cmd.tempFiles);
      }, 5000);
      
      resolve({
        success: true,
        exitCode: 0,
        stdout: "",
        stderr: "",
      });
    });

    child.on("error", (error) => {
      // Clean up temp files on error too
      cleanupTempFiles(cmd.tempFiles);
      
      // Common error: wt.exe not found
      const errorMsg = error.message.includes("ENOENT")
        ? `Windows Terminal not found at '${cmd.exePath}'. Is it installed and in PATH?`
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
 * Clean up temporary script files.
 */
async function cleanupTempFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await rm(file, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Build a Windows command line string from args.
 * Properly quotes arguments that contain spaces or special characters.
 */
function buildWindowsCommandLine(exe: string, args: string[]): string {
  const quote = (arg: string): string => {
    // If arg contains spaces, quotes, or semicolons, wrap in quotes
    if (/[\s";]/.test(arg)) {
      // Escape existing quotes by doubling them
      const escaped = arg.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return arg;
  };
  
  return [exe, ...args].map(quote).join(" ");
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
