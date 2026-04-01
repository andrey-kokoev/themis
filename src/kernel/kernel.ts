/**
 * Themis Kernel
 * 
 * Implements kernel laws K1-K5.
 * Minimal semantic core with well-formedness, normalization, equivalence, and satisfaction.
 */

import type {
  KernelWorkspace,
  KernelRole,
  KernelSubject,
  KernelRelation,
  KernelError,
  KernelVerdict,
  SatisfactionResult,
} from "../types/kernel.js";
import type { Fact } from "../types/runtime-integration.js";

// ============================================================================
// K2: Well-Formedness
// ============================================================================

function createError(type: KernelError["type"], details: Omit<KernelError, "type">): KernelError {
  return { type, ...details } as KernelError;
}

/**
 * Check if workspace is well-formed.
 * Law K2.1: Workspace well-formedness
 */
export function wellFormed(workspace: KernelWorkspace): KernelVerdict {
  const errors: KernelError[] = [];

  // Check workspace id
  if (!workspace.id || workspace.id.trim() === "") {
    errors.push({ type: "EmptyWorkspaceId" });
  }

  // Check at least one role
  if (workspace.roles.length === 0) {
    errors.push({ type: "NoRolesInWorkspace" });
  }

  // Check unique role ids
  const roleIds = new Map<string, number>();
  for (const role of workspace.roles) {
    const count = roleIds.get(role.id) || 0;
    roleIds.set(role.id, count + 1);
  }
  for (const [roleId, count] of roleIds) {
    if (count > 1) {
      errors.push({ type: "DuplicateRoleId", roleId });
    }
  }

  // Check unique subject identities
  const subjectIds = new Map<string, number>();
  for (const role of workspace.roles) {
    const count = subjectIds.get(role.subject.identity) || 0;
    subjectIds.set(role.subject.identity, count + 1);
  }
  for (const [subjectId, count] of subjectIds) {
    if (count > 1) {
      errors.push({ type: "DuplicateSubjectIdentity", subjectId });
    }
  }

  // Check role well-formedness
  for (const role of workspace.roles) {
    const roleErrors = wellFormedRole(role);
    errors.push(...roleErrors);
  }

  // Check relation endpoints resolve
  const validRoleIds = new Set(workspace.roles.map(r => r.id));
  for (const relation of workspace.relations) {
    if (!validRoleIds.has(relation.source)) {
      errors.push({
        type: "MissingRelationEndpoint",
        relation,
        endpoint: "source",
      });
    }
    if (!validRoleIds.has(relation.target)) {
      errors.push({
        type: "MissingRelationEndpoint",
        relation,
        endpoint: "target",
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

/**
 * Check if role is well-formed.
 * Law K2.2: Role well-formedness
 */
function wellFormedRole(role: KernelRole): KernelError[] {
  const errors: KernelError[] = [];

  if (!role.id || role.id.trim() === "") {
    errors.push({ type: "EmptyRoleId" });
  }

  if (!role.kind || role.kind.trim() === "") {
    errors.push({ type: "EmptyRoleKind", roleId: role.id || "<empty>" });
  }

  // Check subject
  if (!role.subject.identity || role.subject.identity.trim() === "") {
    errors.push({ type: "MissingSubjectIdentity", roleId: role.id });
  }
  if (!role.subject.reference || role.subject.reference.trim() === "") {
    errors.push({ type: "MissingSubjectReference", roleId: role.id });
  }

  // Check at least one realizer
  if (role.realizers.length === 0) {
    errors.push({ type: "MissingRoleRealizer", roleId: role.id });
  }

  // Check at least one witness
  if (role.witnesses.length === 0) {
    errors.push({ type: "MissingRoleWitness", roleId: role.id });
  }

  return errors;
}

// ============================================================================
// K3: Normalization
// ============================================================================

/**
 * Normalize workspace for deterministic comparison.
 * Law K3: Deterministic ordering
 */
export function normalize(workspace: KernelWorkspace): KernelWorkspace {
  // Sort roles by id
  const sortedRoles = [...workspace.roles].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  // Sort relations by (kind, source, target)
  const sortedRelations = [...workspace.relations].sort((a, b) => {
    const tupleA = `${a.kind}\t${a.source}\t${a.target}`;
    const tupleB = `${b.kind}\t${b.source}\t${b.target}`;
    return tupleA.localeCompare(tupleB);
  });

  // Sort context entries
  const sortedContext = new Map(
    [...workspace.context.entries()].sort(([a], [b]) => a.localeCompare(b))
  );

  return {
    ...workspace,
    roles: sortedRoles,
    relations: sortedRelations,
    context: sortedContext,
  };
}

// ============================================================================
// K4: Equivalence
// ============================================================================

/**
 * Check equivalence of two workspaces.
 * Law K4: equiv(a, b) := normalize(a) == normalize(b)
 */
export function equiv(a: KernelWorkspace, b: KernelWorkspace): boolean {
  const normA = normalize(a);
  const normB = normalize(b);

  // Compare ids
  if (normA.id !== normB.id) return false;

  // Compare context
  if (normA.context.size !== normB.context.size) return false;
  for (const [key, valA] of normA.context) {
    const valB = normB.context.get(key);
    if (valB !== valA) return false;
  }

  // Compare persistence and equivalence
  if (normA.persistence !== normB.persistence) return false;
  if (normA.equivalence !== normB.equivalence) return false;

  // Compare roles
  if (normA.roles.length !== normB.roles.length) return false;
  for (let i = 0; i < normA.roles.length; i++) {
    if (!rolesEqual(normA.roles[i], normB.roles[i])) return false;
  }

  // Compare relations
  if (normA.relations.length !== normB.relations.length) return false;
  for (let i = 0; i < normA.relations.length; i++) {
    if (!relationsEqual(normA.relations[i], normB.relations[i])) return false;
  }

  return true;
}

function rolesEqual(a: KernelRole, b: KernelRole): boolean {
  if (a.id !== b.id) return false;
  if (a.kind !== b.kind) return false;
  if (!subjectsEqual(a.subject, b.subject)) return false;
  if (a.realizers.length !== b.realizers.length) return false;
  if (a.witnesses.length !== b.witnesses.length) return false;
  return true;
}

function subjectsEqual(a: KernelSubject, b: KernelSubject): boolean {
  if (a.identity !== b.identity) return false;
  if (a.reference !== b.reference) return false;
  if (a.locator !== b.locator) return false;
  return true;
}

function relationsEqual(a: KernelRelation, b: KernelRelation): boolean {
  if (a.kind !== b.kind) return false;
  if (a.source !== b.source) return false;
  if (a.target !== b.target) return false;
  return true;
}

// ============================================================================
// K5: Satisfaction
// ============================================================================

/**
 * Check if a role is satisfied by observed facts.
 * Law K5.1: Role satisfaction
 */
export function satisfiedRole(
  workspace: KernelWorkspace,
  facts: Fact[],
  roleId: string
): SatisfactionResult {
  const role = workspace.roles.find(r => r.id === roleId);
  if (!role) {
    return { satisfied: false, reasons: [`Role "${roleId}" not found`] };
  }

  const reasons: string[] = [];

  // Check subject observed
  const subjectObserved = facts.some(
    f => f.tag === "SubjectObserved" && f.subjectId === role.subject.identity
  );
  if (!subjectObserved) {
    reasons.push(`Subject "${role.subject.identity}" not observed`);
  }

  // Check realizer observed
  const realizerObserved = facts.some(
    f =>
      f.tag === "RoleRealized" &&
      f.roleId === roleId &&
      role.realizers.some(r => r.class === f.realizerClass)
  );
  if (!realizerObserved) {
    reasons.push(`No matching realizer observed for role "${roleId}"`);
  }

  return {
    satisfied: subjectObserved && realizerObserved,
    reasons,
  };
}

/**
 * Check if workspace is satisfied by observed facts.
 * Law K5.2: Workspace satisfaction
 */
export function satisfiedWorkspace(
  workspace: KernelWorkspace,
  facts: Fact[]
): SatisfactionResult {
  const reasons: string[] = [];
  let allSatisfied = true;

  // Check all roles satisfied
  for (const role of workspace.roles) {
    const result = satisfiedRole(workspace, facts, role.id);
    if (!result.satisfied) {
      allSatisfied = false;
      reasons.push(...result.reasons);
    }
  }

  // Check all relations observed
  const validRoleIds = new Set(workspace.roles.map(r => r.id));
  for (const relation of workspace.relations) {
    const observed = facts.some(
      f =>
        f.tag === "RelationObserved" &&
        f.kind === relation.kind &&
        f.source === relation.source &&
        f.target === relation.target
    );
    if (!observed) {
      allSatisfied = false;
      reasons.push(
        `Relation "${relation.kind}" from "${relation.source}" to "${relation.target}" not observed`
      );
    }
  }

  return { satisfied: allSatisfied, reasons };
}
