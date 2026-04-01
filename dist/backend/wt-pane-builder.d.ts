/**
 * Windows Terminal Pane Command Builder (Task 029C)
 *
 * Implements lawbook 064C.
 * Converts TabbedModule with panes into wt.exe split-pane commands.
 */
import type { TabbedModule } from "../types/tabs.js";
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
export declare function buildWtPaneCommand(module: TabbedModule, options?: {
    wtPath?: string;
    wslDistro?: string;
    workingDir?: string;
}): WtShellCommand;
/**
 * Format WT command for display.
 */
export declare function formatWtCommand(cmd: WtShellCommand): string;
//# sourceMappingURL=wt-pane-builder.d.ts.map