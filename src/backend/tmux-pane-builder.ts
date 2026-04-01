/**
 * Tmux Pane Command Builder (Task 029B)
 * 
 * Implements lawbook 064B.
 * Converts TabbedModule with panes into tmux split commands.
 */

import type { TabbedModule, TabBlock, PaneBlock, LayoutKind } from "../types/tabs.js";

/**
 * Tmux shell command.
 */
export type TmuxShellCommand = {
  tag: "tmux";
  args: string[];
  description: string;
};

/**
 * Build tmux commands from tabbed module.
 * 
 * Law T1-T2: Creates session, windows, splits, and sends commands.
 */
export function buildTmuxPaneCommands(module: TabbedModule): TmuxShellCommand[] {
  const commands: TmuxShellCommand[] = [];
  const sessionName = module.moduleId;
  const tabs = module.workspace.tabs;

  if (tabs.length === 0) {
    throw new Error("Module has no tabs");
  }

  // Create session with first tab
  const firstTab = tabs[0]!;
  commands.push({
    tag: "tmux",
    args: ["new-session", "-d", "-s", sessionName, "-n", firstTab.name],
    description: `Create session '${sessionName}' with window '${firstTab.name}'`,
  });

  // Build first tab's panes (skipping window creation since done above)
  commands.push(...buildTabPanes(sessionName, firstTab, true));

  // Build remaining tabs
  for (let i = 1; i < tabs.length; i++) {
    commands.push(...buildTabCommands(sessionName, tabs[i]!));
  }

  // Final attachment
  commands.push({
    tag: "tmux",
    args: ["attach", "-t", sessionName],
    description: `Attach to session '${sessionName}'`,
  });

  return commands;
}

/**
 * Build commands for a single tab (creates window first).
 */
function buildTabCommands(sessionName: string, tab: TabBlock): TmuxShellCommand[] {
  const commands: TmuxShellCommand[] = [];
  const windowName = tab.name;

  // Create window
  commands.push({
    tag: "tmux",
    args: ["new-window", "-t", sessionName, "-n", windowName],
    description: `Create window '${windowName}'`,
  });

  // Build panes
  commands.push(...buildTabPanes(sessionName, tab, false));

  return commands;
}

/**
 * Build pane commands for a tab.
 * @param skipFirstWindow - If true, don't create window (already exists)
 */
function buildTabPanes(sessionName: string, tab: TabBlock, skipFirstWindow: boolean): TmuxShellCommand[] {
  const commands: TmuxShellCommand[] = [];
  const windowName = tab.name;
  const panes = tab.panes;

  if (panes.length === 0) {
    throw new Error(`Tab '${windowName}' has no panes`);
  }

  // Subsequent panes: split from previous (Law T2.2)
  for (let i = 1; i < panes.length; i++) {
    const pane = panes[i]!;
    const layout = pane.layout ?? tab.layout;
    const splitFlag = layout === "horizontal" ? "-h" : "-v";

    // Target the previous pane
    const target = `${sessionName}:${windowName}.${i - 1}`;

    commands.push({
      tag: "tmux",
      args: ["split-window", splitFlag, "-t", target],
      description: `Split ${layout} from pane ${i - 1}`,
    });
  }

  // Send commands to panes (Law T2.3)
  for (let i = 0; i < panes.length; i++) {
    const pane = panes[i]!;
    if (pane.command) {
      const target = `${sessionName}:${windowName}.${i}`;
      commands.push({
        tag: "tmux",
        args: ["send-keys", "-t", target, pane.command, "C-m"],
        description: `Send command to pane ${i}`,
      });
    }
  }

  return commands;
}

/**
 * Format tmux command for display.
 */
export function formatTmuxCommand(cmd: TmuxShellCommand): string {
  const args = cmd.args.map(arg => {
    if (arg.includes(" ") || arg.includes("'")) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  });
  return `tmux ${args.join(" ")}`;
}
