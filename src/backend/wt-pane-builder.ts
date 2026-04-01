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
 * 
 * Law W1-W2: Single invocation with new-tab and split-pane commands.
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
    wslDistro = "Ubuntu",
    workingDir = process.cwd(),
  } = options;

  const args: string[] = [];
  let firstTab = true;

  for (const tab of module.workspace.tabs) {
    // Separator between tabs
    if (!firstTab) {
      args.push(";");
    }
    firstTab = false;

    // Build tab arguments
    const tabArgs = buildTabArgs(tab, wslDistro, workingDir);
    args.push(...tabArgs);
  }

  return {
    tag: "wt",
    exePath: wtPath,
    args,
    description: `Launch Windows Terminal with ${module.workspace.tabs.length} tab(s), ${countPanes(module)} pane(s)`,
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
  args.push("--startingDirectory", wslToWindowsPath(workingDir, wslDistro));

  // First pane command
  if (panes[0]?.command) {
    args.push("--", "wsl.exe", "-d", wslDistro, "-e", "bash", "-c", panes[0].command);
  }

  // Subsequent panes: split-pane
  for (let i = 1; i < panes.length; i++) {
    const pane = panes[i]!;
    const layout = pane.layout ?? tab.layout;
    const splitFlag = layout === "horizontal" ? "--horizontal" : "--vertical";

    args.push(";");
    args.push("split-pane", splitFlag);
    args.push("--profile", wslDistro);
    args.push("--startingDirectory", wslToWindowsPath(workingDir, wslDistro));

    if (pane.command) {
      args.push("--", "wsl.exe", "-d", wslDistro, "-e", "bash", "-c", pane.command);
    }
  }

  return args;
}

/**
 * Convert Unix path to Windows WSL UNC path.
 */
function wslToWindowsPath(unixPath: string, distro: string = "Ubuntu"): string {
  const normalized = unixPath.replace(/^\//, "").replace(/\//g, "\\");
  return `\\\\wsl$\\${distro}\\${normalized}`;
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
  const args = cmd.args.map(arg => {
    if (arg.includes(" ") || arg.includes(";") || arg.includes("\\")) {
      return `"${arg}"`;
    }
    return arg;
  });
  return `${cmd.exePath} ${args.join(" ")}`;
}
