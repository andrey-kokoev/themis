#!/usr/bin/env node
/**
 * Themis CLI
 *
 * Entry point for operational deployment.
 * Implements lawbook 058 (CLI Operational Semantics).
 *
 * Uses existing terminal DSL (SurfaceModule/Workspace/RoleBlock).
 * Maps realizers to tmux commands.
 *
 * Usage:
 *   themis <file.themis>           # Run with tmux (default)
 *   themis --backend=tmux <file>   # Explicit tmux
 *   themis --dry-run <file>        # Show commands only
 *   themis --verbose <file>        # Show pipeline details
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseModule } from "./parser/module-parser.js";
import { buildTmuxCommands, formatTmuxCommand } from "./backend/tmux-command-builder.js";
import { formatWtCommand } from "./backend/wt-command-builder.js";
import { executeTmuxSequence, checkTmuxSessionExists } from "./backend/executor.js";
function parseArgs(args) {
    let file = null;
    let backend = "tmux";
    let dryRun = false;
    let verbose = false;
    for (const arg of args) {
        if (arg === "--help" || arg === "-h") {
            printUsage();
            process.exit(0);
        }
        if (arg === "--version" || arg === "-v") {
            console.log("themis 0.1.0");
            process.exit(0);
        }
        if (arg.startsWith("--backend=")) {
            const value = arg.slice("--backend=".length);
            if (value !== "tmux" && value !== "wt") {
                console.error(`Error: Unknown backend '${value}'. Use 'tmux' or 'wt'.`);
                return null;
            }
            backend = value;
            continue;
        }
        if (arg === "--dry-run") {
            dryRun = true;
            continue;
        }
        if (arg === "--verbose") {
            verbose = true;
            continue;
        }
        if (!arg.startsWith("-")) {
            if (file) {
                console.error("Error: Multiple file arguments provided.");
                return null;
            }
            file = arg;
            continue;
        }
        console.error(`Error: Unknown option '${arg}'.`);
        return null;
    }
    if (!file) {
        console.error("Error: No file provided.");
        return null;
    }
    return { file, backend, dryRun, verbose };
}
function printUsage() {
    console.log(`
Usage: themis [options] <file.themis>

Options:
  --backend=tmux|wt    Backend to use (default: tmux)
  --dry-run           Show commands without executing
  --verbose           Show pipeline details
  --help, -h          Show this help
  --version, -v       Show version

Examples:
  themis dev.themis                    # Run with tmux
  themis --dry-run --verbose dev.themis # Show what would be done
`);
}
/**
 * Extract roles from SurfaceModule workspace.
 */
function extractRoles(module) {
    if (!module.workspace)
        return [];
    return module.workspace.items.filter((item) => item.tag === "RoleBlock");
}
/**
 * Convert SurfaceModule to tmux backend plan.
 *
 * Maps each role to a tmux window.
 * Uses first "Local" realizer payload as the command.
 */
function moduleToTmuxPlan(module) {
    const sessionName = module.moduleId;
    const roles = extractRoles(module);
    if (roles.length === 0) {
        throw new Error("Module has no roles defined");
    }
    const steps = [];
    // First role: create session with window
    const firstRole = roles[0];
    steps.push({
        tag: "NewSession",
        sessionName,
        windowName: firstRole.roleId,
    });
    // Send command if Local realizer exists
    const firstCmd = getLocalCommand(firstRole);
    if (firstCmd) {
        steps.push({
            tag: "SendKeys",
            sessionName,
            windowName: firstRole.roleId,
            command: firstCmd,
        });
    }
    // Additional roles: new windows
    for (let i = 1; i < roles.length; i++) {
        const role = roles[i];
        steps.push({
            tag: "NewWindow",
            sessionName,
            windowName: role.roleId,
        });
        const cmd = getLocalCommand(role);
        if (cmd) {
            steps.push({
                tag: "SendKeys",
                sessionName,
                windowName: role.roleId,
                command: cmd,
            });
        }
    }
    // Final attachment
    steps.push({
        tag: "AttachSession",
        sessionName,
    });
    return {
        tag: "TmuxBackendPlan",
        sessionBinding: sessionName,
        steps,
    };
}
/**
 * Get Local realizer command from role.
 */
function getLocalCommand(role) {
    const localRealizer = role.realizers.find(r => r.class === "Local");
    return localRealizer?.payload;
}
/**
 * Main CLI entry point.
 */
async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (!options) {
        printUsage();
        return 1;
    }
    // Stage 1: Read file
    let content;
    try {
        const path = resolve(options.file);
        content = readFileSync(path, "utf-8");
        if (options.verbose) {
            console.log(`✓ Read file: ${path}`);
        }
    }
    catch {
        console.error(`Error: Cannot read file '${options.file}'`);
        return 1;
    }
    // Stage 2: Parse
    let module;
    try {
        module = parseModule(content);
        if (options.verbose) {
            console.log(`✓ Parsed module: ${module.moduleId}`);
            const roles = extractRoles(module);
            console.log(`  Found ${roles.length} role(s)`);
            for (const role of roles) {
                const cmd = getLocalCommand(role);
                console.log(`    - ${role.roleId}${cmd ? `: "${cmd}"` : ""}`);
            }
        }
    }
    catch (error) {
        console.error("Error: Parse failed");
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
    // Stage 3-7: Backend routing, realization, command building, execution
    if (options.backend === "tmux") {
        return await runTmuxBackend(module, options);
    }
    else {
        return await runWtBackend(module, options);
    }
}
/**
 * Run tmux backend.
 */
async function runTmuxBackend(module, options) {
    const sessionName = module.moduleId;
    // Check if session already exists
    const exists = await checkTmuxSessionExists(sessionName);
    if (exists) {
        console.error(`Error: Session '${sessionName}' already exists.`);
        console.error(`Use 'tmux attach -t ${sessionName}' or choose a different module name.`);
        return 1;
    }
    // Build backend plan
    let plan;
    try {
        plan = moduleToTmuxPlan(module);
        if (options.verbose) {
            console.log(`✓ Generated backend plan with ${plan.steps.length} step(s)`);
        }
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return 1;
    }
    // Build commands
    const commands = buildTmuxCommands(plan);
    if (options.verbose) {
        console.log(`✓ Built ${commands.length} tmux command(s)`);
    }
    // Show commands
    if (options.dryRun || options.verbose) {
        console.log("\nCommands to execute:");
        for (const cmd of commands) {
            console.log(`  $ ${formatTmuxCommand(cmd)}`);
            console.log(`    # ${cmd.description}`);
        }
    }
    if (options.dryRun) {
        console.log("\n(Dry run - no commands executed)");
        return 0;
    }
    // Execute
    const result = await executeTmuxSequence(commands, {
        dryRun: false,
        verbose: false,
    });
    if (!result.success) {
        console.error(`Error: ${result.stderr}`);
        return result.exitCode;
    }
    return 0;
}
/**
 * Run Windows Terminal backend.
 */
async function runWtBackend(module, options) {
    // Build WT command
    let cmd;
    try {
        const { buildWtCommand } = await import("./backend/wt-command-builder.js");
        const fileDir = resolve(options.file, "..");
        cmd = buildWtCommand(module, {
            workingDir: fileDir,
        });
        if (options.verbose) {
            console.log(`✓ Generated WT command`);
        }
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return 1;
    }
    // Show command
    if (options.dryRun || options.verbose) {
        console.log("\nCommand to execute:");
        console.log(`  $ ${formatWtCommand(cmd)}`);
        console.log(`    # ${cmd.description}`);
    }
    if (options.dryRun) {
        console.log("\n(Dry run - no commands executed)");
        return 0;
    }
    // Execute
    const { executeWtCommand } = await import("./backend/executor.js");
    const result = await executeWtCommand(cmd.exePath, cmd.args);
    if (!result.success) {
        console.error(`Error: ${result.stderr}`);
        return result.exitCode;
    }
    console.log(`\nLaunched Windows Terminal`);
    return 0;
}
// Run main
main().then((code) => process.exit(code));
//# sourceMappingURL=cli.js.map