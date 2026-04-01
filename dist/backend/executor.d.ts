/**
 * Backend Executor
 *
 * Implements lawbook 058 (C2, C4).
 * Executes shell commands for tmux and Windows Terminal.
 */
import type { TmuxShellCommand } from "./tmux-command-builder.js";
/**
 * Execution result.
 */
export type ExecutionResult = {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    error?: Error;
};
/**
 * Execute a tmux command.
 *
 * Law C2.2: Error propagation
 * Law C4.1: Session exists check
 */
export declare function executeTmuxCommand(cmd: TmuxShellCommand): Promise<ExecutionResult>;
/**
 * Check if tmux session exists.
 *
 * Law C4.1: Returns true if session exists.
 */
export declare function checkTmuxSessionExists(sessionName: string): Promise<boolean>;
/**
 * Execute multiple tmux commands in sequence.
 *
 * Law C2.1: Pipeline execution
 * Law C2.2: Stop on first failure
 */
export declare function executeTmuxSequence(commands: TmuxShellCommand[], options?: {
    dryRun?: boolean;
    verbose?: boolean;
}): Promise<ExecutionResult>;
/**
 * Execute Windows Terminal command.
 *
 * Law W3: Fire and forget execution.
 */
export declare function executeWtCommand(wtPath: string, args: string[]): Promise<ExecutionResult>;
/**
 * Check if Windows Terminal is available.
 */
export declare function checkWtAvailable(wtPath?: string): Promise<boolean>;
//# sourceMappingURL=executor.d.ts.map