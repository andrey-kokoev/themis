/**
 * Runtime Integration (Kernel-Aligned)
 *
 * Implements integration laws I1-I5 from lawbook 014.
 * Evaluates observed facts against workspace and produces admissibility verdict.
 *
 * KERNEL ALIGNMENT: Core satisfaction now flows through kernel.
 * Runtime layer handles runtime-specific concerns (unknown entities, format validation).
 */
import { satisfiedWorkspace, satisfiedRole } from "../kernel/kernel.js";
import { toKernelWorkspace } from "../kernel/ast-to-kernel.js";
function createConflict(type, message, details) {
    return { type, message, ...details };
}
/**
 * Evaluate facts against workspace.
 *
 * Law I1: Role satisfaction (via kernel)
 * Law I2: Fact matching
 * Law I3: Relation correctness
 * Law I4: Unknown fact detection
 * Law I5: Admissibility
 *
 * KERNEL ALIGNMENT: Core satisfaction delegated to kernel.satisfiedWorkspace
 */
export function integrate(input) {
    const { workspace, facts } = input;
    const conflicts = [];
    const notes = [];
    // Extract roles and relations from workspace
    const roles = workspace.items.filter(i => i.tag === "RoleBlock");
    const declaredRelations = workspace.items.filter(i => i.tag === "RelationBlock");
    // Build lookup maps for runtime-specific validation
    const roleById = new Map(roles.map(r => [r.roleId, r]));
    const subjectIdToRole = new Map(roles.map(r => [r.subject.identity, r]));
    // Categorize facts
    const subjectObservations = facts.filter(f => f.tag === "SubjectObserved");
    const roleRealizations = facts.filter(f => f.tag === "RoleRealized");
    const relationObservations = facts.filter(f => f.tag === "RelationObserved");
    // I4.2: Check for unknown subjects (runtime-specific validation)
    for (const fact of subjectObservations) {
        if (!subjectIdToRole.has(fact.subjectId)) {
            conflicts.push(createConflict("UnknownSubject", `Subject "${fact.subjectId}" observed but not declared in any role`, { subjectId: fact.subjectId }));
        }
    }
    // I4.1: Check for unknown roles in realizations (runtime-specific validation)
    for (const fact of roleRealizations) {
        if (!roleById.has(fact.roleId)) {
            conflicts.push(createConflict("UnknownRole", `Role "${fact.roleId}" realized but not declared in workspace`, { roleId: fact.roleId }));
        }
    }
    // I3.2: Check observed relations are declared (runtime-specific validation)
    const declaredRelationSet = new Set(declaredRelations.map(r => `${r.kind}\t${r.source}\t${r.target}`));
    for (const fact of relationObservations) {
        const key = `${fact.kind}\t${fact.source}\t${fact.target}`;
        if (!declaredRelationSet.has(key)) {
            conflicts.push(createConflict("UnexpectedRelation", `Relation "${fact.kind}" from "${fact.source}" to "${fact.target}" observed but not declared`, { relation: { kind: fact.kind, source: fact.source, target: fact.target } }));
        }
    }
    // KERNEL ALIGNMENT: Core satisfaction through kernel
    const kernelWorkspace = toKernelWorkspace(workspace);
    const kernelResult = satisfiedWorkspace(kernelWorkspace, facts);
    // Convert kernel result to integration verdict format
    const satisfied = [];
    const unsatisfied = [];
    if (kernelResult.satisfied) {
        // All roles satisfied according to kernel
        for (const role of roles) {
            satisfied.push(role.roleId);
        }
    }
    else {
        // Some roles unsatisfied - check each role individually via kernel
        for (const role of roles) {
            const roleResult = satisfiedRole(kernelWorkspace, facts, role.roleId);
            if (roleResult.satisfied) {
                satisfied.push(role.roleId);
            }
            else {
                unsatisfied.push(role.roleId);
                // Add conflicts for unsatisfied roles
                const subjectObserved = subjectObservations.some(f => f.subjectId === role.subject.identity);
                const realizerMatched = roleRealizations.some(f => f.roleId === role.roleId &&
                    role.realizers.some(r => r.class === f.realizerClass));
                if (!subjectObserved) {
                    conflicts.push(createConflict("MissingSubjectObservation", `Role "${role.roleId}" subject "${role.subject.identity}" not observed`, { roleId: role.roleId }));
                }
                if (!realizerMatched) {
                    conflicts.push(createConflict("MissingRoleRealization", `Role "${role.roleId}" has no matching realizer observation`, { roleId: role.roleId }));
                }
            }
        }
        // I3.1: Add conflicts for missing relations (from kernel result)
        for (const rel of declaredRelations) {
            const key = `${rel.kind}\t${rel.source}\t${rel.target}`;
            const observed = relationObservations.some(f => `${f.kind}\t${f.source}\t${f.target}` === key);
            if (!observed) {
                conflicts.push(createConflict("MissingRelation", `Relation "${rel.kind}" from "${rel.source}" to "${rel.target}" declared but not observed`, { relation: { kind: rel.kind, source: rel.source, target: rel.target } }));
            }
        }
    }
    // I5.1: Determine admissibility
    const admissible = conflicts.length === 0 &&
        unsatisfied.length === 0 &&
        satisfied.length === roles.length;
    notes.push(`Roles: ${satisfied.length} satisfied, ${unsatisfied.length} unsatisfied`);
    notes.push(`Relations: ${declaredRelations.length} declared, ${relationObservations.length} observed`);
    notes.push(`Conflicts: ${conflicts.length}`);
    notes.push(`Kernel-aligned: true`);
    return {
        admissible,
        conflicts,
        satisfied,
        unsatisfied,
        notes,
    };
}
//# sourceMappingURL=integration.js.map