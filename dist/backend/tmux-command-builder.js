/**
 * Tmux Command Builder
 *
 * Implements lawbook 058 (C3).
 * Converts tmux backend plan into executable tmux commands.
 */
/**
 * Build tmux shell commands from backend plan.
 *
 * Law C3: Converts BackendStep to actual tmux commands.
 */
export function buildTmuxCommands(plan) {
    const commands = [];
    const sessionName = plan.sessionBinding;
    // Track if we've seen the first window
    let firstWindow = true;
    for (const step of plan.steps) {
        switch (step.tag) {
            case "NewSession": {
                // Law C3.1: Session creation
                commands.push({
                    tag: "tmux",
                    args: ["new-session", "-d", "-s", sessionName, "-n", step.windowName],
                    description: `Create session '${sessionName}' with window '${step.windowName}'`,
                });
                firstWindow = false;
                break;
            }
            case "NewWindow": {
                // Law C3.2: Window creation
                commands.push({
                    tag: "tmux",
                    args: ["new-window", "-t", sessionName, "-n", step.windowName],
                    description: `Create window '${step.windowName}' in session '${sessionName}'`,
                });
                break;
            }
            case "SendKeys": {
                // Law C3.3: Command execution
                // Target format: session:window
                const target = `${sessionName}:${step.windowName}`;
                commands.push({
                    tag: "tmux",
                    args: ["send-keys", "-t", target, step.command, "C-m"],
                    description: `Send command to window '${step.windowName}'`,
                });
                break;
            }
            case "SelectLayout": {
                // Layout selection
                const target = `${sessionName}:${step.windowName}`;
                commands.push({
                    tag: "tmux",
                    args: ["select-layout", "-t", target, step.layout],
                    description: `Set layout '${step.layout}' for window '${step.windowName}'`,
                });
                break;
            }
            case "AttachSession": {
                // Law C3.4: Attachment (deferred to end)
                // We collect this but execute last
                break;
            }
        }
    }
    // Law C3.4: Final attachment
    commands.push({
        tag: "tmux",
        args: ["attach", "-t", sessionName],
        description: `Attach to session '${sessionName}'`,
    });
    return commands;
}
/**
 * Format tmux command for display (dry-run).
 */
export function formatTmuxCommand(cmd) {
    const args = cmd.args.map(arg => {
        // Quote arguments that need it
        if (arg.includes(" ") || arg.includes("'")) {
            return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
    });
    return `tmux ${args.join(" ")}`;
}
/**
 * Check if tmux session exists.
 */
export function sessionExistsCommand(sessionName) {
    return {
        tag: "tmux",
        args: ["has-session", "-t", sessionName],
        description: `Check if session '${sessionName}' exists`,
    };
}
//# sourceMappingURL=tmux-command-builder.js.map