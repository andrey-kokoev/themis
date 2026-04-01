/**
 * Session State Persistence (Task 029D)
 *
 * Implements lawbook 064D.
 * Save and restore session structure across reboots.
 */
import { readFileSync, writeFileSync, existsSync, renameSync } from "fs";
/**
 * State file schema version.
 */
const STATE_VERSION = "1";
/**
 * Save state from TabbedModule.
 *
 * Law P2.1, P2.3: Atomic write of declared state.
 */
export function saveState(module, backend, statePath) {
    const state = {
        version: STATE_VERSION,
        module: module.moduleId,
        created: new Date().toISOString(),
        source: "declared",
        session: {
            name: module.moduleId,
            backend,
            tabs: module.workspace.tabs.map(tabToState),
        },
    };
    // Atomic write (Law P2.3)
    const tempPath = `${statePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf-8");
    renameSync(tempPath, statePath);
}
/**
 * Check if state file exists.
 */
export function hasState(statePath) {
    return existsSync(statePath);
}
/**
 * Load state from file.
 *
 * Law P3.2, P5.1: Version check and migration.
 */
export function loadState(statePath) {
    if (!existsSync(statePath)) {
        throw new Error(`State file not found: ${statePath}`);
    }
    const content = readFileSync(statePath, "utf-8");
    const state = JSON.parse(content);
    // Version check (Law P5.1, P5.2)
    if (state.version !== STATE_VERSION) {
        if (parseInt(state.version) > parseInt(STATE_VERSION)) {
            throw new Error(`State file version ${state.version} is newer than supported ${STATE_VERSION}`);
        }
        // Future: migrate older versions here
    }
    return state;
}
/**
 * Convert state back to TabbedModule (for restore).
 */
export function stateToModule(state) {
    return {
        tag: "TabbedModule",
        moduleId: state.module,
        imports: [],
        workspace: {
            tag: "TabWorkspace",
            name: state.session.name,
            tabs: state.session.tabs.map(stateToTab),
        },
    };
}
/**
 * Get state file path from module path.
 */
export function getStatePath(modulePath) {
    return `${modulePath}.state.json`;
}
// Helpers
function tabToState(tab) {
    return {
        name: tab.name,
        layout: tab.layout,
        panes: tab.panes.map(paneToState),
    };
}
function paneToState(pane, index) {
    return {
        index,
        command: pane.command ?? null,
        layout: pane.layout ?? null,
    };
}
function stateToTab(state) {
    return {
        tag: "TabBlock",
        name: state.name,
        target: "local", // Default, not stored in state
        layout: state.layout,
        panes: state.panes.map(stateToPane),
    };
}
function stateToPane(state) {
    return {
        tag: "PaneBlock",
        layout: state.layout ?? undefined,
        command: state.command ?? undefined,
    };
}
//# sourceMappingURL=session-state.js.map