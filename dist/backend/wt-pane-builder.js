/**
 * Windows Terminal Pane Command Builder (Task 029C)
 *
 * Implements lawbook 064C.
 * Converts TabbedModule with panes into wt.exe split-pane commands.
 */
/**
 * Build Windows Terminal command from tabbed module.
 */
export function buildWtPaneCommand(module, options = {}) {
    const { wtPath = "wt.exe", wslDistro = "Ubuntu", workingDir = process.cwd(), } = options;
    const args = [];
    let firstTab = true;
    for (const tab of module.workspace.tabs) {
        if (!firstTab) {
            args.push(";");
        }
        firstTab = false;
        const tabArgs = buildTabArgs(tab, wslDistro, workingDir);
        args.push(...tabArgs);
    }
    return {
        tag: "wt",
        exePath: wtPath,
        args,
        description: `Launch Windows Terminal with ${module.workspace.tabs.length} tab(s)`,
    };
}
/**
 * Build arguments for a tab with panes.
 */
function buildTabArgs(tab, wslDistro, workingDir) {
    const args = [];
    const panes = tab.panes;
    if (panes.length === 0) {
        throw new Error(`Tab '${tab.name}' has no panes`);
    }
    // First pane: new-tab
    args.push("new-tab");
    args.push("--title", tab.name);
    args.push("--profile", wslDistro);
    // First pane command - wrap entire thing in single quotes
    if (panes[0]?.command) {
        const cmd = wrapCmd(panes[0].command, workingDir);
        args.push("--", "wsl.exe", "-d", wslDistro, "bash", "-c", cmd);
    }
    // Subsequent panes: split-pane
    for (let i = 1; i < panes.length; i++) {
        const pane = panes[i];
        const layout = pane.layout ?? tab.layout;
        const splitFlag = layout === "horizontal" ? "--horizontal" : "--vertical";
        args.push(";");
        args.push("split-pane", splitFlag);
        args.push("--profile", wslDistro);
        if (pane.command) {
            const cmd = wrapCmd(pane.command, workingDir);
            args.push("--", "wsl.exe", "-d", wslDistro, "bash", "-c", cmd);
        }
    }
    return args;
}
/**
 * Wrap command with cd to working directory.
 * Returns a single string suitable for bash -c.
 */
function wrapCmd(cmd, workingDir) {
    // Simple approach: wrap the entire command in single quotes
    // If the command contains single quotes, we need to handle that
    if (cmd.includes("'")) {
        // Replace ' with '"'"' (end quote, literal quote, start quote)
        const escapedCmd = cmd.replace(/'/g, "'\"'\"'");
        return `cd '${workingDir}' && ${escapedCmd}`;
    }
    // No single quotes in command - simple case
    return `cd '${workingDir}' && ${cmd}`;
}
/**
 * Count total panes in module.
 */
function countPanes(module) {
    return module.workspace.tabs.reduce((sum, tab) => sum + tab.panes.length, 0);
}
/**
 * Format WT command for display.
 */
export function formatWtCommand(cmd) {
    // Quote args that contain spaces
    return cmd.exePath + " " + cmd.args.map(arg => {
        if (arg.includes(" ") || arg.includes(";")) {
            return `"${arg}"`;
        }
        return arg;
    }).join(" ");
}
//# sourceMappingURL=wt-pane-builder.js.map