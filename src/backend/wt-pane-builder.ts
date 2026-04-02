/**
 * Windows Terminal Pane Command Builder (Task 029C)
 * 
 * Implements lawbook 064C.
 * Converts TabbedModule with panes into wt.exe split-pane commands.
 * 
 * Uses temp file approach to avoid complex bash quoting issues.
 */

import { writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { TabbedModule, TabBlock, PaneBlock, LayoutKind } from "../types/tabs.js";

/**
 * WT shell command.
 */
export type WtShellCommand = {
  tag: "wt";
  exePath: string;
  args: string[];
  description: string;
  tempFiles: string[]; // Track temp files for cleanup
};

/**
 * Build Windows Terminal command from tabbed module.
 * Creates temp script files to avoid bash escaping issues.
 */
export function buildWtPaneCommand(
  module: TabbedModule,
  options: {
    wtPath?: string;
    wslDistro?: string;
    wtProfile?: string;
    workingDir?: string;
  } = {}
): WtShellCommand {
  const {
    wtPath = "wt.exe",
    wslDistro = "Ubuntu-24.04",
    wtProfile = "Ubuntu 24.04.1 LTS",
    workingDir = process.cwd(),
  } = options;

  // Create temp directory for scripts
  const tempDir = join(tmpdir(), `themis_${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  const tempFiles: string[] = [];
  const args: string[] = ["-w", "0"]; // -w 0 = current window
  let firstTab = true;

  for (const tab of module.workspace.tabs) {
    if (!firstTab) {
      args.push(";");
    }
    firstTab = false;

    const { args: tabArgs, tempFiles: tabTempFiles } = buildTabArgs(
      tab,
      wslDistro,
      wtProfile,
      workingDir,
      tempDir
    );
    args.push(...tabArgs);
    tempFiles.push(...tabTempFiles);
  }

  return {
    tag: "wt",
    exePath: wtPath,
    args,
    description: `Launch Windows Terminal with ${module.workspace.tabs.length} tab(s)`,
    tempFiles,
  };
}

/**
 * Build arguments for a tab with panes.
 * Returns args and list of temp files created.
 */
function buildTabArgs(
  tab: TabBlock,
  wslDistro: string,
  wtProfile: string,
  workingDir: string,
  tempDir: string
): { args: string[]; tempFiles: string[] } {
  const args: string[] = [];
  const tempFiles: string[] = [];
  const panes = tab.panes;

  if (panes.length === 0) {
    throw new Error(`Tab '${tab.name}' has no panes`);
  }

  // First pane: new-tab
  args.push("new-tab");
  args.push("--title", tab.name);
  args.push("--profile", wtProfile);

  // First pane command
  if (panes[0]?.command) {
    const scriptPath = writeTempScript(tempDir, panes[0].command, workingDir, 0);
    tempFiles.push(scriptPath);
    // Reference script via WSL path
    const wslScriptPath = toWslPath(scriptPath);
    args.push("--", "wsl.exe", "-d", wslDistro, "bash", wslScriptPath);
  }

  // Subsequent panes: split-pane
  for (let i = 1; i < panes.length; i++) {
    const pane = panes[i]!;
    const layout = pane.layout ?? tab.layout;
    const splitFlag = layout === "horizontal" ? "--horizontal" : "--vertical";

    args.push(";");
    args.push("split-pane", splitFlag);
    args.push("--profile", wtProfile);

    if (pane.command) {
      const scriptPath = writeTempScript(tempDir, pane.command, workingDir, i);
      tempFiles.push(scriptPath);
      const wslScriptPath = toWslPath(scriptPath);
      args.push("--", "wsl.exe", "-d", wslDistro, "bash", wslScriptPath);
    }
  }

  return { args, tempFiles };
}

/**
 * Write command to a temp script file.
 */
function writeTempScript(tempDir: string, command: string, workingDir: string, index: number): string {
  const scriptPath = join(tempDir, `pane_${index}.sh`);
  const scriptContent = `#!/bin/bash
# Themis pane script - auto-generated
cd '${workingDir.replace(/'/g, "'\\''")}'
${command}
`;
  writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
  return scriptPath;
}

/**
 * Convert Windows path to WSL path.
 * E.g., C:\Users\... -> /mnt/c/Users/...
 */
function toWslPath(windowsPath: string): string {
  // Handle /tmp/... paths (already WSL-style if on Linux/Mac)
  if (windowsPath.startsWith("/tmp/") || windowsPath.startsWith("/home/")) {
    return windowsPath;
  }
  // Convert C:\... to /mnt/c/...
  const match = windowsPath.match(/^([A-Za-z]):\\(.*)$/);
  if (match) {
    const drive = match[1].toLowerCase();
    const path = match[2].replace(/\\/g, "/");
    return `/mnt/${drive}/${path}`;
  }
  return windowsPath;
}

/**
 * Count total panes in module.
 */
function countPanes(module: TabbedModule): number {
  return module.workspace.tabs.reduce((sum, tab) => sum + tab.panes.length, 0);
}

/**
 * Format WT command for display.
 */
export function formatWtCommand(cmd: WtShellCommand): string {
  return cmd.exePath + " " + cmd.args.map(arg => {
    if (arg.includes(" ") || arg.includes(";")) {
      return `"${arg}"`;
    }
    return arg;
  }).join(" ");
}
