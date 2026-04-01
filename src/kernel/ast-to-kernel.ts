/**
 * AST to Kernel Converter
 * 
 * Converts surface AST Workspace to KernelWorkspace for kernel operations.
 * This is the bridge layer that enables downstream modules to use explicit kernel semantics.
 */

import type { Workspace, RoleBlock, ContextBlock } from "../types/ast.js";
import type {
  KernelWorkspace,
  KernelRole,
  KernelSubject,
  KernelRealizer,
  KernelWitness,
  KernelRelation,
} from "../types/kernel.js";

/**
 * Convert AST Workspace to KernelWorkspace.
 * 
 * This projection extracts the semantic core needed for kernel operations.
 * It intentionally loses surface-level details (e.g., source location) that
 * don't affect semantic satisfaction.
 */
export function toKernelWorkspace(workspace: Workspace): KernelWorkspace {
  // Extract context from ContextBlock
  const context = new Map<string, string>();
  const contextBlocks = workspace.items.filter(
    (i): i is ContextBlock => i.tag === "ContextBlock"
  );
  for (const block of contextBlocks) {
    for (const entry of block.entries) {
      if (!context.has(entry.key)) {
        context.set(entry.key, entry.value);
      }
    }
  }

  // Extract persistence mode
  const persistenceClause = workspace.items.find(i => i.tag === "PersistenceClause") as
    | { mode: string }
    | undefined;
  const persistence = persistenceClause?.mode || "session";

  // Extract equivalence mode
  const equivalenceClause = workspace.items.find(i => i.tag === "EquivalenceClause") as
    | { name: string }
    | undefined;
  const equivalence = equivalenceClause?.name || "strict";

  // Convert roles
  const roles: KernelRole[] = [];
  for (const item of workspace.items) {
    if (item.tag === "RoleBlock") {
      roles.push(toKernelRole(item));
    }
  }

  // Convert relations
  const relations: KernelRelation[] = [];
  for (const item of workspace.items) {
    if (item.tag === "RelationBlock") {
      relations.push({
        tag: "Relation",
        kind: item.kind,
        source: item.source,
        target: item.target,
      });
    }
  }

  return {
    tag: "Workspace",
    id: workspace.name,
    context,
    persistence,
    equivalence,
    roles,
    relations,
  };
}

function toKernelRole(roleBlock: RoleBlock): KernelRole {
  const realizers: KernelRealizer[] = roleBlock.realizers.map(r => ({
    tag: "Realizer",
    class: r.class,
    payload: r.payload,
  }));

  const witnesses: KernelWitness[] = roleBlock.witnesses.map(w => ({
    tag: "Witness",
    class: w.class,
    payload: w.payload,
  }));

  const subject: KernelSubject = {
    tag: "Subject",
    identity: roleBlock.subject.identity,
    reference: roleBlock.subject.reference,
    locator: roleBlock.subject.locator,
  };

  return {
    tag: "Role",
    id: roleBlock.roleId,
    kind: roleBlock.kind,
    subject,
    realizers,
    witnesses,
  };
}
