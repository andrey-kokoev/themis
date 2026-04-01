/**
 * Windows Terminal Pane Command Builder (Task 029C)
 * 
 * Implements lawbook 064C.
 * Converts TabbedModule with panes into wt.exe split-pane commands.
 */

import type { TabbedModule, TabBlock, PaneBlock, LayoutKind } from "../types/tabs.js";

/**
 * WT shell command.
 */
export type WtShellCommand = {
  tag: "wt";
  exePath: string;
  args: string[];
  description: string;
};

/**
 * Build Windows Terminal command from tabbed module.
 */
export function buildWtPaneCommand(
  module: TabbedModule,
  options: {
    wtPath?: string;
    wslDistro?: string;
    workingDir?: string;
  } = {}
): WtShellCommand {
  const {
    wtPath = "wt.exe",
    wslDistro = "Ubuntu 24.04.1 LTS",  // Use exact profile name
    workingDir = process.cwd(),
  } = options;

  const args: string[] = ["-w", "0"];  // -w 0 = current window
  let firstTab = true;

  for (const tab of module.workspace.tabs) {
    if (!firstTab) {
      args.push(";");
    }
    firstTab = false;

    const tabArgs = buildTabArgs(tab, wslDistro, workingDir);
    args.push(...tabArgs);
  }

  return {
    tag: "wt",
    exePath: wtPath,
    args,
    description: `Launch Windows Terminal with ${module.workspace.tabs.length} tab(s)`,
  };
}

/**
 * Build arguments for a tab with panes.
 */
function buildTabArgs(tab: TabBlock, wslDistro: string, workingDir: string): string[] {
  const args: string[] = [];
  const panes = tab.panes;

  if (panes.length === 0) {
    throw new Error(`Tab '${tab.name}' has no panes`);
  }

  // First pane: new-tab
  args.push("new-tab");
  args.push("--title", tab.name);
  args.push("--profile", wslDistro);

  // First pane command
  if (panes[0]?.command) {
    const cmd = wrapCmd(panes[0].command, workingDir);
    args.push("--", "wsl.exe", "-d", wslDistro, "bash", "-c", cmd);
  }

  // Subsequent panes: split-pane
  for (let i = 1; i < panes.length; i++) {
    const pane = panes[i]!;
    const layout = pane.layout ?? tab.layout;
    const splitFlag = layout === "horizontal" ? "--horizontal" : "--vertical";

    args.push(";");
    args.push("split-pane", splitFlag);
    args.push("--profile", wslDistro);

    if (pane.command) {
      const cmd = wrapCmd(pane.command, workingDir);
      args.push("--", "wsl.exe", "-d", wslDistro, "bash", "-c", cmd);
    }
  }

  return args;
}

/**
 * Wrap command with cd to working directory.
 * Properly escapes single quotes for bash -c.
 */
function wrapCmd(cmd: string, workingDir: string): string {
  // Escape single quotes: ' -> '\''
  // This ends the single quote, adds an escaped quote, then restarts
  const escapedCmd = cmd.replace(/'/g, "'\\''");
  const escapedDir = workingDir.replace(/'/g, "'\\''");
  
  return `cd '${escapedDir}' && ${escapedCmd}`;
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
