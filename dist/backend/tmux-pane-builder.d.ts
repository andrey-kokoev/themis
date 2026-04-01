/**
 * Tmux Pane Command Builder (Task 029B, 030)
 *
 * Implements lawbook 064B (pane layouts) and 068 (direct pane pipes).
 */
import type { TabbedModule } from "../types/tabs.js";
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
export declare function buildTmuxPaneCommands(module: TabbedModule): Command[];
export declare function formatTmuxCommand(cmd: Command): string;
//# sourceMappingURL=tmux-pane-builder.d.ts.map