/**
 * Tmux Pane Command Builder (Task 029B)
 *
 * Implements lawbook 064B.
 * Converts TabbedModule with panes into tmux split commands.
 */
import type { TabbedModule } from "../types/tabs.js";
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
export declare function buildTmuxPaneCommands(module: TabbedModule): TmuxShellCommand[];
/**
 * Format tmux command for display.
 */
export declare function formatTmuxCommand(cmd: TmuxShellCommand): string;
//# sourceMappingURL=tmux-pane-builder.d.ts.map