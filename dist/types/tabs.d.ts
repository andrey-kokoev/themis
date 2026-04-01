/**
 * Tab and Pane Types for Operational DSL (Task 029A)
 *
 * Defines surface syntax types for pane layouts.
 * Replaces/complements Workspace for operational use cases.
 */
/**
 * Layout direction for panes.
 */
export type LayoutKind = "horizontal" | "vertical";
/**
 * A pane within a tab.
 */
export type PaneBlock = {
    tag: "PaneBlock";
    /** Optional name for referencing from pipes */
    name?: string;
    /** Optional explicit layout (defaults to tab layout) */
    layout?: LayoutKind;
    /** Optional command to run in pane */
    command?: string;
};
/**
 * A tab containing one or more panes.
 */
export type TabBlock = {
    tag: "TabBlock";
    name: string;
    /** Target profile/environment (e.g., "local", "Ubuntu") */
    target: string;
    /** Default layout for panes in this tab */
    layout: LayoutKind;
    panes: PaneBlock[];
};
/**
 * Unidirectional pipe declaration.
 * Data flows from -> to only.
 */
export type PipeDecl = {
    tag: "PipeDecl";
    from: string;
    to: string;
};
/**
 * Send statement in startup block.
 */
export type SendStmt = {
    tag: "SendStmt";
    message: string;
    target: string;
};
/**
 * Wait statement in startup block.
 */
export type WaitStmt = {
    tag: "WaitStmt";
    seconds: number;
};
/**
 * Startup block for workspace initialization.
 */
export type StartupBlock = {
    tag: "StartupBlock";
    statements: (SendStmt | WaitStmt)[];
};
/**
 * Operational workspace containing tabs, pipes, and startup.
 * Alternative to Workspace for CLI/operational use.
 */
export type TabWorkspace = {
    tag: "TabWorkspace";
    name: string;
    tabs: TabBlock[];
    pipes: PipeDecl[];
    startup?: StartupBlock;
};
/**
 * Extended SurfaceModule with tab support.
 */
export type TabbedModule = {
    tag: "TabbedModule";
    moduleId: string;
    imports: string[];
    workspace: TabWorkspace;
};
/**
 * Check if value is a valid LayoutKind.
 */
export declare function isLayoutKind(value: string): value is LayoutKind;
/**
 * Get layout with default.
 */
export declare function layoutWithDefault(layout: LayoutKind | undefined): LayoutKind;
//# sourceMappingURL=tabs.d.ts.map