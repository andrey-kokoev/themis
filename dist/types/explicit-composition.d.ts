/**
 * Explicit Composition Types
 *
 * Types for explicit-relaxation composition with namespaces and aliasing.
 */
import type { Workspace } from "./ast.js";
import type { Module, CompositionConflict } from "./composition.js";
export type NamespaceDecl = {
    moduleId: string;
    namespace: string;
};
export type RoleAliasDecl = {
    moduleId: string;
    localRoleId: string;
    composedRoleId: string;
};
export type SharedIdentityDecl = {
    subjectId: string;
    modules: string[];
};
export type ExplicitCompositionPolicy = {
    namespaces?: NamespaceDecl[];
    aliases?: RoleAliasDecl[];
    sharedIdentities?: SharedIdentityDecl[];
};
export type ExplicitCompositionVerdict = {
    composed?: Workspace;
    admissible: boolean;
    conflicts: CompositionConflict[];
    notes?: string[];
    liftingMap?: Record<string, string>;
};
export type NamespacedModule = Module & {
    namespace?: string;
};
//# sourceMappingURL=explicit-composition.d.ts.map