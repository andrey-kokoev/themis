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
 * Operational workspace containing tabs.
 * Alternative to Workspace for CLI/operational use.
 */
export type TabWorkspace = {
  tag: "TabWorkspace";
  name: string;
  tabs: TabBlock[];
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
export function isLayoutKind(value: string): value is LayoutKind {
  return value === "horizontal" || value === "vertical";
}

/**
 * Get layout with default.
 */
export function layoutWithDefault(layout: LayoutKind | undefined): LayoutKind {
  return layout ?? "horizontal";
}
