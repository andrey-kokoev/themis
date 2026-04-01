/**
 * Tab and Pane Types for Operational DSL (Task 029A)
 *
 * Defines surface syntax types for pane layouts.
 * Replaces/complements Workspace for operational use cases.
 */
/**
 * Check if value is a valid LayoutKind.
 */
export function isLayoutKind(value) {
    return value === "horizontal" || value === "vertical";
}
/**
 * Get layout with default.
 */
export function layoutWithDefault(layout) {
    return layout ?? "horizontal";
}
//# sourceMappingURL=tabs.js.map