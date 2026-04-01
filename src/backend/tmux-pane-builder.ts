/**
 * Tmux Pane Command Builder (Task 029B, 030)
 * 
 * Implements lawbook 064B (pane layouts) and 068 (direct pane pipes).
 */

import type { TabbedModule, TabBlock, PaneBlock, LayoutKind, PipeDecl } from "../types/tabs.js";

export type TmuxShellCommand = {
  tag: "tmux";
  args: string[];
  description: string;
};

export type ShellCommand = {
  tag: "shell";
  command: string;
  description: string;
};

export type Command = TmuxShellCommand | ShellCommand;

/**
 * Build commands from tabbed module.
 * Returns shell commands for setup + tmux commands.
 */
export function buildTmuxPaneCommands(module: TabbedModule): Command[] {
  const commands: Command[] = [];
  const sessionName = module.moduleId;
  const tabs = module.workspace.tabs;
  const pipes = module.workspace.pipes;

  if (tabs.length === 0) {
    throw new Error("Module has no tabs");
  }

  // Build pipe map: pane name -> { readsFrom, writesTo }
  const pipeMap = buildPipeMap(pipes || []);

  // Create FIFOs for pipes (Law P2.1)
  if (pipes.length > 0) {
    const fifoDir = `/tmp/themis/${sessionName}`;
    commands.push({
      tag: "shell",
      command: `mkdir -p ${fifoDir}`,
      description: `Create FIFO directory`,
    });
    
    for (const pipe of pipes) {
      const fifoPath = `${fifoDir}/${pipe.from}_to_${pipe.to}`;
      commands.push({
        tag: "shell",
        command: `mkfifo ${fifoPath} 2>/dev/null || true`,
        description: `Create FIFO ${pipe.from}_to_${pipe.to}`,
      });
    }
  }

  // Create session with first tab
  const firstTab = tabs[0]!;
  commands.push({
    tag: "tmux",
    args: ["new-session", "-d", "-s", sessionName, "-n", firstTab.name],
    description: `Create session '${sessionName}'`,
  });

  // Build first tab's panes
  commands.push(...buildTabPanes(sessionName, firstTab, pipeMap, true));

  // Build remaining tabs
  for (let i = 1; i < tabs.length; i++) {
    commands.push(...buildTabCommands(sessionName, tabs[i]!, pipeMap));
  }

  // Startup sequence (Law S4.1: after panes, before attach)
  if (module.workspace.startup) {
    commands.push(...buildStartupCommands(sessionName, module.workspace.startup, module.workspace.tabs));
  }

  // Final attachment
  commands.push({
    tag: "tmux",
    args: ["attach", "-t", sessionName],
    description: `Attach to session`,
  });

  return commands;
}

/**
 * Build map of pane connections from unidirectional pipe declarations.
 */
function buildPipeMap(pipes: PipeDecl[]): Map<string, { readsFrom?: string; writesTo?: string }> {
  const map = new Map<string, { readsFrom?: string; writesTo?: string }>();
  
  for (const pipe of pipes) {
    // from writes to to
    if (!map.has(pipe.from)) map.set(pipe.from, {});
    if (!map.has(pipe.to)) map.set(pipe.to, {});
    
    map.get(pipe.from)!.writesTo = pipe.to;
    map.get(pipe.to)!.readsFrom = pipe.from;
  }
  
  return map;
}

function buildTabCommands(sessionName: string, tab: TabBlock, pipeMap: Map<string, any>): Command[] {
  const commands: Command[] = [];
  
  commands.push({
    tag: "tmux",
    args: ["new-window", "-t", sessionName, "-n", tab.name],
    description: `Create window '${tab.name}'`,
  });

  commands.push(...buildTabPanes(sessionName, tab, pipeMap, false));
  return commands;
}

function buildTabPanes(
  sessionName: string, 
  tab: TabBlock, 
  pipeMap: Map<string, any>,
  skipFirstWindow: boolean
): Command[] {
  const commands: Command[] = [];
  const windowName = tab.name;
  const panes = tab.panes;

  if (panes.length === 0) {
    throw new Error(`Tab '${windowName}' has no panes`);
  }

  // Build pane index map (for targeting)
  const paneIndices = new Map<string, number>();
  panes.forEach((p, i) => {
    // @ts-ignore - pane name access
    if (p.name) paneIndices.set(p.name, i);
  });

  // Split panes
  for (let i = 1; i < panes.length; i++) {
    const pane = panes[i]!;
    const layout = pane.layout ?? tab.layout;
    const splitFlag = layout === "horizontal" ? "-h" : "-v";
    const target = `${sessionName}:${windowName}.${i - 1}`;

    commands.push({
      tag: "tmux",
      args: ["split-window", splitFlag, "-t", target],
      description: `Split pane ${i}`,
    });
  }

  // Send commands to panes
  for (let i = 0; i < panes.length; i++) {
    const pane = panes[i]!;
    // @ts-ignore
    const paneName = pane.name;
    const target = `${sessionName}:${windowName}.${i}`;
    
    let cmd = pane.command || "";
    
    // If pane has pipe connections, wrap with FIFO redirects
    const connections = paneName ? pipeMap.get(paneName) : undefined;
    if (connections && (connections.writesTo || connections.readsFrom)) {
      const fifoDir = `/tmp/themis/${sessionName}`;
      const redirects: string[] = [];
      
      if (connections.writesTo) {
        const outFifo = `${fifoDir}/${paneName}_to_${connections.writesTo}`;
        redirects.push(`> ${outFifo}`);
      }
      if (connections.readsFrom) {
        const inFifo = `${fifoDir}/${connections.readsFrom}_to_${paneName}`;
        redirects.push(`< ${inFifo}`);
      }
      
      if (redirects.length > 0) {
        cmd = `stdbuf -o0 ${cmd} ${redirects.join(" ")}`;
      }
    }
    
    if (cmd) {
      commands.push({
        tag: "tmux",
        args: ["send-keys", "-t", target, cmd, "C-m"],
        description: `Run in pane ${i}`,
      });
    }
  }

  return commands;
}

/**
 * Build startup commands from startup block.
 */
function buildStartupCommands(
  sessionName: string,
  startup: any,
  tabs: any[]
): Command[] {
  const commands: Command[] = [];
  
  // Build pane name -> window index map
  const paneWindowMap = new Map<string, { windowName: string; paneIndex: number }>();
  for (const tab of tabs) {
    let paneIndex = 0;
    for (const pane of tab.panes) {
      if (pane.name) {
        paneWindowMap.set(pane.name, { windowName: tab.name, paneIndex });
      }
      paneIndex++;
    }
  }

  for (const stmt of startup.statements) {
    if (stmt.tag === "SendStmt") {
      const location = paneWindowMap.get(stmt.target);
      if (!location) {
        throw new Error(`Startup send target '${stmt.target}' not found in any pane`);
      }
      const target = `${sessionName}:${location.windowName}.${location.paneIndex}`;
      commands.push({
        tag: "tmux",
        args: ["send-keys", "-t", target, stmt.message, "C-m"],
        description: `Send message to ${stmt.target}`,
      });
    } else if (stmt.tag === "WaitStmt") {
      commands.push({
        tag: "shell",
        command: `sleep ${stmt.seconds}`,
        description: `Wait ${stmt.seconds}s`,
      });
    }
  }

  return commands;
}

export function formatTmuxCommand(cmd: Command): string {
  if (cmd.tag === "shell") {
    return `$ ${cmd.command}`;
  }
  const args = cmd.args.map(arg => {
    if (arg.includes(" ") || arg.includes("'")) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  });
  return `$ tmux ${args.join(" ")}`;
}
