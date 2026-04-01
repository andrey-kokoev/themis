/**
 * Runtime Integration Types
 * 
 * Types for evaluating facts against workspace.
 */

import type { Workspace } from "./ast.js";

export type Fact =
  | {
      tag: "SubjectObserved";
      subjectId: string;
      reference?: string;
      locator?: string;
    }
  | {
      tag: "RoleRealized";
      roleId: string;
      realizerClass: string;
      payload: string;
    }
  | {
      tag: "RelationObserved";
      kind: string;
      source: string;
      target: string;
    };

export type IntegrationConflict = {
  type: string;
  message: string;
  roleId?: string;
  subjectId?: string;
  relation?: { kind: string; source: string; target: string };
};

export type IntegrationVerdict = {
  admissible: boolean;
  conflicts: IntegrationConflict[];
  satisfied: string[];    // role ids satisfied
  unsatisfied: string[];  // role ids expected but not satisfied
  notes?: string[];
};

export type RuntimeInput = {
  workspace: Workspace;
  facts: Fact[];
};
