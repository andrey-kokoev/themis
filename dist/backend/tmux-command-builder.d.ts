/**
 * Tmux Command Builder
 *
 * Implements lawbook 058 (C3).
 * Converts tmux backend plan into executable tmux commands.
 */
import type { TmuxBackendPlan } from "../types/tmux-backend.js";
/**
 * Shell command for tmux execution.
 */
export type TmuxShellCommand = {
    tag: "tmux";
    args: string[];
    description: string;
};
/**
 * Build tmux shell commands from backend plan.
 *
 * Law C3: Converts BackendStep to actual tmux commands.
 */
export declare function buildTmuxCommands(plan: TmuxBackendPlan): TmuxShellCommand[];
/**
 * Format tmux command for display (dry-run).
 */
export declare function formatTmuxCommand(cmd: TmuxShellCommand): string;
/**
 * Check if tmux session exists.
 */
export declare function sessionExistsCommand(sessionName: string): TmuxShellCommand;
//# sourceMappingURL=tmux-command-builder.d.ts.map