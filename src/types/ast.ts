/**
 * AST Types for Minimal Parser Subset
 * 
 * Defines the concrete output shape of the parser for the
 * scoped subset specified in lawbook 002-minimal-parser-contract-v0.
 */

export type Workspace = {
  tag: "Workspace";
  name: string;
  items: WorkspaceItem[];
};

export type WorkspaceItem =
  | ContextBlock
  | PersistenceClause
  | EquivalenceClause
  | RoleBlock
  | RelationBlock;

export type ContextBlock = {
  tag: "ContextBlock";
  entries: ContextEntry[];
};

export type ContextEntry = {
  tag: "ContextEntry";
  key: string;
  value: string;
};

export type PersistenceClause = {
  tag: "PersistenceClause";
  mode: string;
};

export type EquivalenceClause = {
  tag: "EquivalenceClause";
  name: string;
};

export type RoleBlock = {
  tag: "RoleBlock";
  roleId: string;
  kind: string;
  subject: SubjectBlock;
  realizers: RealizerBlock[];
  witnesses: WitnessBlock[];
};

export type SubjectBlock = {
  tag: "SubjectBlock";
  identity: string;
  reference: string;
  locator?: string;
};

export type RealizerBlock = {
  tag: "RealizerBlock";
  class: string;
  payload: string;
};

export type WitnessBlock = {
  tag: "WitnessBlock";
  class: string;
  payload: string;
};

export type RelationBlock = {
  tag: "RelationBlock";
  kind: string;
  source: string;
  target: string;
};

// Union type for all AST nodes
export type AstNode =
  | Workspace
  | ContextBlock
  | ContextEntry
  | PersistenceClause
  | EquivalenceClause
  | RoleBlock
  | SubjectBlock
  | RealizerBlock
  | WitnessBlock
  | RelationBlock;
