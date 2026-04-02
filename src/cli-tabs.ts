#!/usr/bin/env node
/**
 * Themis CLI for Tabs/Pane Layout
 * 
 * Entry point for Task 029 operational deployment.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { parseTabsModule } from "./parser/tabs-parser.js";
import { buildTmuxPaneCommands, formatTmuxCommand } from "./backend/tmux-pane-builder.js";
import { buildWtPaneCommand, formatWtCommand } from "./backend/wt-pane-builder.js";
import { executeTmuxSequence, checkTmuxSessionExists } from "./backend/executor.js";
import { saveState, loadState, stateToModule, getStatePath, hasState } from "./state/session-state.js";

type CliOptions = {
  command: "run" | "save" | "restore" | "dry-run";
  file: string;
  backend: "tmux" | "wt";
  verbose: boolean;
};

function parseArgs(args: string[]): CliOptions | null {
  let command: CliOptions["command"] = "run";
  let file: string | null = null;
  let backend: "tmux" | "wt" = "tmux";
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--version" || arg === "-v") {
      console.log("themis-tabs 0.1.0");
      process.exit(0);
    }

    if (arg === "save") {
      command = "save";
      continue;
    }

    if (arg === "restore") {
      command = "restore";
      continue;
    }

    if (arg === "--dry-run") {
      command = "dry-run";
      continue;
    }

    if (arg.startsWith("--backend=")) {
      const val = arg.slice("--backend=".length);
      if (val === "tmux" || val === "wt") backend = val;
      continue;
    }

    if (arg === "--verbose") {
      verbose = true;
      continue;
    }

    if (!arg.startsWith("-")) {
      if (file) {
        console.error("Error: Multiple files provided");
        return null;
      }
      file = arg;
      continue;
    }

    console.error(`Error: Unknown option '${arg}'`);
    return null;
  }

  if (!file) {
    console.error("Error: No file provided");
    return null;
  }

  return { command, file, backend, verbose };
}

function printUsage(): void {
  console.log(`
Usage: themis-tabs [command] [options] <file.themis>

Commands:
  (none)      Run the workspace (default)
  save        Save session state
  restore     Restore from saved state

Options:
  --backend=tmux|wt   Backend to use (default: tmux)
  --dry-run          Show commands without executing
  --verbose          Show details
  --help, -h         Show this help

Examples:
  themis-tabs dev.themis              # Run workspace
  themis-tabs save dev.themis         # Save state
  themis-tabs restore dev.themis      # Restore from state
  themis-tabs --dry-run dev.themis    # Preview commands
`);
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) {
    printUsage();
    return 1;
  }

  const filePath = resolve(opts.file);

  // Handle restore command
  if (opts.command === "restore") {
    const statePath = getStatePath(filePath);
    if (!hasState(statePath)) {
      console.error(`Error: No state file found at ${statePath}`);
      console.error("Run 'themis-tabs save' first, or just 'themis-tabs' to run fresh.");
      return 1;
    }

    try {
      const state = loadState(statePath);
      const module = stateToModule(state);
      
      if (opts.verbose) {
        console.log(`Restored from state: ${module.moduleId}`);
        console.log(`Backend: ${state.session.backend}`);
        console.log(`Tabs: ${module.workspace.tabs.length}`);
      }

      // Run with restored module
      if (state.session.backend === "tmux") {
        return await runTmux(module, { ...opts, file: filePath });
      } else {
        return await runWt(module, { ...opts, file: filePath });
      }
    } catch (e) {
      console.error(`Error restoring state: ${e instanceof Error ? e.message : e}`);
      return 1;
    }
  }

  // Parse module
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    console.error(`Error: Cannot read file '${opts.file}'`);
    return 1;
  }

  let module;
  try {
    module = parseTabsModule(content);
    if (opts.verbose) {
      console.log(`Parsed module: ${module.moduleId}`);
      console.log(`Tabs: ${module.workspace.tabs.length}`);
      for (const tab of module.workspace.tabs) {
        console.log(`  - ${tab.name}: ${tab.panes.length} pane(s)`);
      }
    }
  } catch (e) {
    console.error(`Parse error: ${e instanceof Error ? e.message : e}`);
    return 1;
  }

  // Handle save command
  if (opts.command === "save") {
    const statePath = getStatePath(filePath);
    try {
      saveState(module, opts.backend, statePath);
      console.log(`State saved to: ${statePath}`);
      return 0;
    } catch (e) {
      console.error(`Error saving state: ${e instanceof Error ? e.message : e}`);
      return 1;
    }
  }

  // Handle run/dry-run
  if (opts.backend === "tmux") {
    return await runTmux(module, { ...opts, file: filePath });
  } else {
    return await runWt(module, { ...opts, file: filePath });
  }
}

async function runTmux(
  module: ReturnType<typeof parseTabsModule>,
  opts: CliOptions & { file: string }
): Promise<number> {
  const sessionName = module.moduleId;

  // Check if exists
  const exists = await checkTmuxSessionExists(sessionName);
  if (exists) {
    console.error(`Error: Session '${sessionName}' already exists.`);
    console.error(`Use 'tmux attach -t ${sessionName}' or kill it first.`);
    return 1;
  }

  // Build commands
  const commands = buildTmuxPaneCommands(module);

  if (opts.verbose || opts.command === "dry-run") {
    console.log("\nCommands:");
    for (const cmd of commands) {
      console.log(`  $ ${formatTmuxCommand(cmd)}`);
    }
  }

  if (opts.command === "dry-run") {
    console.log("\n(Dry run - no commands executed)");
    return 0;
  }

  // Execute
  const result = await executeTmuxSequence(commands, { dryRun: false, verbose: false });
  if (!result.success) {
    console.error(`Error: ${result.stderr}`);
    return result.exitCode;
  }

  return 0;
}

async function runWt(
  module: ReturnType<typeof parseTabsModule>,
  opts: CliOptions & { file: string }
): Promise<number> {
  const workingDir = dirname(opts.file);
  const cmd = buildWtPaneCommand(module, {
    workingDir,
    wslDistro: "Ubuntu-24.04",
    wtProfile: "Ubuntu 24.04.1 LTS",
  });

  if (opts.verbose || opts.command === "dry-run") {
    console.log(`\nCommand: ${formatWtCommand(cmd)}`);
    if (cmd.tempFiles.length > 0) {
      console.log(`Temp scripts: ${cmd.tempFiles.join(", ")}`);
    }
  }

  if (opts.command === "dry-run") {
    console.log("\n(Dry run - no commands executed)");
    return 0;
  }

  const { executeWtCommand } = await import("./backend/executor.js");
  const result = await executeWtCommand(cmd);

  if (!result.success) {
    console.error(`Error: ${result.stderr}`);
    return result.exitCode;
  }

  console.log("Launched Windows Terminal");
  return 0;
}

main().then(code => process.exit(code));
