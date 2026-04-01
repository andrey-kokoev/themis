/**
 * Session State Persistence (Task 029D)
 *
 * Implements lawbook 064D.
 * Save and restore session structure across reboots.
 */
import type { TabbedModule } from "../types/tabs.js";
/**
 * Serialized pane state.
 */
export type PaneState = {
    index: number;
    command: string | null;
    layout: "horizontal" | "vertical" | null;
};
/**
 * Serialized tab state.
 */
export type TabState = {
    name: string;
    layout: "horizontal" | "vertical";
    panes: PaneState[];
};
/**
 * Serialized session state.
 */
export type SessionState = {
    name: string;
    backend: "tmux" | "wt";
    tabs: TabState[];
};
/**
 * Full state file content.
 */
export type StateFile = {
    version: string;
    module: string;
    created: string;
    source: "declared" | "runtime";
    session: SessionState;
};
/**
 * Save state from TabbedModule.
 *
 * Law P2.1, P2.3: Atomic write of declared state.
 */
export declare function saveState(module: TabbedModule, backend: "tmux" | "wt", statePath: string): void;
/**
 * Check if state file exists.
 */
export declare function hasState(statePath: string): boolean;
/**
 * Load state from file.
 *
 * Law P3.2, P5.1: Version check and migration.
 */
export declare function loadState(statePath: string): StateFile;
/**
 * Convert state back to TabbedModule (for restore).
 */
export declare function stateToModule(state: StateFile): TabbedModule;
/**
 * Get state file path from module path.
 */
export declare function getStatePath(modulePath: string): string;
//# sourceMappingURL=session-state.d.ts.map