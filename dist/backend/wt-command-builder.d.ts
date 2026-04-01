/**
 * Windows Terminal Command Builder
 *
 * Implements lawbook 060.
 * Converts module roles into wt.exe command strings.
 */
import type { SurfaceModule } from "../types/surface-module.js";
/**
 * WT shell command structure.
 */
export type WtShellCommand = {
    tag: "wt";
    exePath: string;
    args: string[];
    description: string;
};
/**
 * Build Windows Terminal command from module.
 *
 * Law W1: Creates wt.exe invocation with new-tab for each role.
 * Law W2: Handles WSL path translation.
 */
export declare function buildWtCommand(module: SurfaceModule, options?: {
    wtPath?: string;
    wslDistro?: string;
    workingDir?: string;
}): WtShellCommand;
/**
 * Convert Unix path to Windows WSL UNC path.
 *
 * Law W2.1: /home/andrey/project → \\wsl$\Ubuntu\home\andrey\project
 */
export declare function wslToWindowsPath(unixPath: string, distro?: string): string;
/**
 * Format WT command for display.
 */
export declare function formatWtCommand(cmd: WtShellCommand): string;
//# sourceMappingURL=wt-command-builder.d.ts.map