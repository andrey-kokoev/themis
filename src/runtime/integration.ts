/**
 * Runtime Integration
 * 
 * Implements integration laws I1-I5 from lawbook 014.
 * Evaluates observed facts against workspace and produces admissibility verdict.
 */

import type { Workspace, RoleBlock, RelationBlock } from "../types/ast.js";
import type {
  Fact,
  IntegrationVerdict,
  IntegrationConflict,
  RuntimeInput,
} from "../types/runtime-integration.js";

function createConflict(
  type: string,
  message: string,
  details?: Partial<IntegrationConflict>
): IntegrationConflict {
  return { type, message, ...details };
}

/**
 * Evaluate facts against workspace.
 * 
 * Law I1: Role satisfaction
 * Law I2: Fact matching
 * Law I3: Relation correctness
 * Law I4: Unknown fact detection
 * Law I5: Admissibility
 */
export function integrate(input: RuntimeInput): IntegrationVerdict {
  const { workspace, facts } = input;
  const conflicts: IntegrationConflict[] = [];
  const satisfied: string[] = [];
  const unsatisfied: string[] = [];
  const notes: string[] = [];

  // Extract roles and relations from workspace
  const roles = workspace.items.filter(i => i.tag === "RoleBlock") as RoleBlock[];
  const declaredRelations = workspace.items.filter(i => i.tag === "RelationBlock") as RelationBlock[];

  // Build lookup maps
  const roleById = new Map(roles.map(r => [r.roleId, r]));
  const subjectIdToRole = new Map(roles.map(r => [r.subject.identity, r]));

  // Categorize facts
  const subjectObservations = facts.filter(f => f.tag === "SubjectObserved");
  const roleRealizations = facts.filter(f => f.tag === "RoleRealized");
  const relationObservations = facts.filter(f => f.tag === "RelationObserved");

  // I4.2: Check for unknown subjects
  for (const fact of subjectObservations) {
    if (!subjectIdToRole.has(fact.subjectId)) {
      conflicts.push(
        createConflict(
          "UnknownSubject",
          `Subject "${fact.subjectId}" observed but not declared in any role`,
          { subjectId: fact.subjectId }
        )
      );
    }
  }

  // I4.1: Check for unknown roles in realizations
  for (const fact of roleRealizations) {
    if (!roleById.has(fact.roleId)) {
      conflicts.push(
        createConflict(
          "UnknownRole",
          `Role "${fact.roleId}" realized but not declared in workspace`,
          { roleId: fact.roleId }
        )
      );
    }
  }

  // I1: Evaluate each role for satisfaction
  for (const role of roles) {
    // I2.1: Check subject observation
    const subjectObserved = subjectObservations.some(
      f => f.subjectId === role.subject.identity
    );

    // I2.2: Check realizer matching
    const realizerMatched = roleRealizations.some(
      f =>
        f.roleId === role.roleId &&
        role.realizers.some(r => r.class === f.realizerClass)
    );

    if (subjectObserved && realizerMatched) {
      satisfied.push(role.roleId);
    } else {
      unsatisfied.push(role.roleId);
      if (!subjectObserved) {
        conflicts.push(
          createConflict(
            "MissingSubjectObservation",
            `Role "${role.roleId}" subject "${role.subject.identity}" not observed`,
            { roleId: role.roleId }
          )
        );
      }
      if (!realizerMatched) {
        conflicts.push(
          createConflict(
            "MissingRoleRealization",
            `Role "${role.roleId}" has no matching realizer observation`,
            { roleId: role.roleId }
          )
        );
      }
    }
  }

  // I3: Relation validation
  // Build set of observed relations
  const observedRelationSet = new Set(
    relationObservations.map(f => `${f.kind}\t${f.source}\t${f.target}`)
  );

  // Build set of declared relations
  const declaredRelationSet = new Set(
    declaredRelations.map(r => `${r.kind}\t${r.source}\t${r.target}`)
  );

  // I3.1: Check declared relations are observed
  for (const rel of declaredRelations) {
    const key = `${rel.kind}\t${rel.source}\t${rel.target}`;
    if (!observedRelationSet.has(key)) {
      conflicts.push(
        createConflict(
          "MissingRelation",
          `Relation "${rel.kind}" from "${rel.source}" to "${rel.target}" declared but not observed`,
          { relation: { kind: rel.kind, source: rel.source, target: rel.target } }
        )
      );
    }
  }

  // I3.2: Check observed relations are declared
  for (const fact of relationObservations) {
    const key = `${fact.kind}\t${fact.source}\t${fact.target}`;
    if (!declaredRelationSet.has(key)) {
      conflicts.push(
        createConflict(
          "UnexpectedRelation",
          `Relation "${fact.kind}" from "${fact.source}" to "${fact.target}" observed but not declared`,
          { relation: { kind: fact.kind, source: fact.source, target: fact.target } }
        )
      );
    }
  }

  // I5.1: Determine admissibility
  const admissible =
    conflicts.length === 0 &&
    unsatisfied.length === 0 &&
    satisfied.length === roles.length;

  notes.push(`Roles: ${satisfied.length} satisfied, ${unsatisfied.length} unsatisfied`);
  notes.push(`Relations: ${declaredRelations.length} declared, ${relationObservations.length} observed`);
  notes.push(`Conflicts: ${conflicts.length}`);

  return {
    admissible,
    conflicts,
    satisfied,
    unsatisfied,
    notes,
  };
}
