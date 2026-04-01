/**
 * Surface Module Types
 * 
 * AST types for module/import surface syntax (Task 017).
 * These represent the syntactic layer that lowers to semantic composition types.
 */

import type { Workspace } from "./ast.js";

/**
 * SurfaceModule represents a parsed module file.
 * Contains imports, composition declarations, and workspace.
 */
export type SurfaceModule = {
  tag: "Module";
  moduleId: string;
  imports: ImportDecl[];
  namespaces: NamespaceDecl[];
  aliases: RoleAliasDecl[];
  sharedIdentities: SharedIdentityDecl[];
  workspace: Workspace;
};

/**
 * Import declaration: symbolic dependency on another module.
 */
export type ImportDecl = {
  tag: "Import";
  moduleId: string;
};

/**
 * Namespace declaration: assigns namespace to imported module.
 */
export type NamespaceDecl = {
  tag: "Namespace";
  moduleId: string;
  namespace: string;
};

/**
 * Role alias declaration: lifts local role to composed name.
 */
export type RoleAliasDecl = {
  tag: "RoleAlias";
  moduleId: string;
  localRoleId: string;
  composedRoleId: string;
};

/**
 * Shared identity declaration: permits subject across multiple modules.
 */
export type SharedIdentityDecl = {
  tag: "SharedIdentity";
  subjectId: string;
  modules: string[];
};

/**
 * LoweredModule represents the result of lowering SurfaceModule.
 * Maps directly to composition inputs.
 */
export type LoweredModule = {
  tag: "LoweredModule";
  /** Module reference for composition */
  module: {
    moduleId: string;
    workspace: Workspace;
  };
  /** Partial explicit composition policy from declarations */
  policy: {
    namespaces: NamespaceDecl[];
    aliases: RoleAliasDecl[];
    sharedIdentities: SharedIdentityDecl[];
  };
  /** Imported module ids */
  imports: string[];
};
