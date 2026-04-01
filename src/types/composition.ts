/**
 * Composition Types
 * 
 * Types for conservative workspace composition.
 */

import type { Workspace } from "./ast.js";

export type ConflictType =
  | "WorkspaceIdCollision"
  | "RoleIdCollision"
  | "SubjectCollision"
  | "ContextKeyCollision"
  | "RelationEndpointMissing"
  | "PersistenceModeConflict"
  | "EquivalenceConflict";

export type CompositionConflict = {
  type: ConflictType;
  message: string;
  moduleIds?: string[];
  details?: Record<string, unknown>;
};

export type CompositionVerdict = {
  composed?: Workspace;
  admissible: boolean;
  conflicts: CompositionConflict[];
  notes?: string[];
};

export type Module = {
  moduleId: string;
  workspace: Workspace;
};
