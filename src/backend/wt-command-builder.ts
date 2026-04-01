/**
 * Windows Terminal Command Builder
 * 
 * Implements lawbook 060.
 * Converts module roles into wt.exe command strings.
 */

import type { SurfaceModule } from "../types/surface-module.js";
import type { RoleBlock } from "../types/ast.js";

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
export function buildWtCommand(
  module: SurfaceModule,
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

  const roles = extractRoles(module);
  if (roles.length === 0) {
    throw new Error("Module has no roles defined");
  }

  // Build new-tab arguments for each role
  const tabArgs: string[][] = [];

  for (const role of roles) {
    const cmd = getLocalCommand(role);
    const tabArg = buildNewTabArgs(role.roleId, cmd, wslDistro, workingDir);
    tabArgs.push(tabArg);
  }

  // Combine with semicolons (WT command separator)
  // First tab uses new-tab, subsequent use ; new-tab
  const args: string[] = [];
  
  for (let i = 0; i < tabArgs.length; i++) {
    if (i > 0) {
      args.push(";");
    }
    args.push("new-tab");
    args.push(...tabArgs[i]!);
  }

  return {
    tag: "wt",
    exePath: wtPath,
    args,
    description: `Launch Windows Terminal with ${roles.length} tab(s)`,
  };
}

/**
 * Build arguments for a single new-tab command.
 */
function buildNewTabArgs(
  roleId: string,
  command: string | undefined,
  wslDistro: string,
  workingDir: string
): string[] {
  const args: string[] = [];

  // Tab title (Law W1.1)
  args.push("--title", roleId);

  // Profile (Law W1.1)
  args.push("--profile", wslDistro);

  // Starting directory (Law W2.2)
  const windowsPath = wslToWindowsPath(workingDir, wslDistro);
  args.push("--startingDirectory", windowsPath);

  // Command to execute (Law W1.3)
  if (command) {
    args.push("--", "wsl.exe", "-d", wslDistro, "-e", "bash", "-c", command);
  }

  return args;
}

/**
 * Convert Unix path to Windows WSL UNC path.
 * 
 * Law W2.1: /home/andrey/project → \\wsl$\Ubuntu\home\andrey\project
 */
export function wslToWindowsPath(unixPath: string, distro: string = "Ubuntu"): string {
  // Remove leading slash, replace remaining slashes with backslashes
  const normalized = unixPath.replace(/^\//, "").replace(/\//g, "\\");
  return `\\\\wsl$\\${distro}\\${normalized}`;
}

/**
 * Format WT command for display.
 */
export function formatWtCommand(cmd: WtShellCommand): string {
  const args = cmd.args.map(arg => {
    // Quote arguments that need it
    if (arg.includes(" ") || arg.includes(";") || arg.includes("\\")) {
      return `"${arg}"`;
    }
    return arg;
  });
  return `${cmd.exePath} ${args.join(" ")}`;
}

/**
 * Extract roles from SurfaceModule.
 */
function extractRoles(module: SurfaceModule): RoleBlock[] {
  if (!module.workspace) return [];
  return module.workspace.items.filter(
    (item): item is RoleBlock => item.tag === "RoleBlock"
  );
}

/**
 * Get Local realizer command from role.
 */
function getLocalCommand(role: RoleBlock): string | undefined {
  const localRealizer = role.realizers.find(r => r.class === "Local");
  return localRealizer?.payload;
}
