/**
 * AST Equality Helpers
 *
 * For testing round-trip invariants and idempotence.
 */
/**
 * Compare two ContextEntry arrays for equality.
 */
function contextEntriesEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].key !== b[i].key || a[i].value !== b[i].value)
            return false;
    }
    return true;
}
/**
 * Compare two SubjectBlock for equality.
 */
function subjectBlockEqual(a, b) {
    return (a.identity === b.identity &&
        a.reference === b.reference &&
        a.locator === b.locator);
}
/**
 * Compare two RealizerBlock arrays for equality.
 * Source order is significant (R3.4).
 */
function realizersEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].class !== b[i].class || a[i].payload !== b[i].payload)
            return false;
    }
    return true;
}
/**
 * Compare two WitnessBlock arrays for equality.
 * Source order is significant (R3.4).
 */
function witnessesEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].class !== b[i].class || a[i].payload !== b[i].payload)
            return false;
    }
    return true;
}
/**
 * Compare two RoleBlock for equality.
 * Note: Role order is normalized during rendering, so this compares
 * the semantic content, not the original source order.
 */
function roleBlockEqual(a, b) {
    return (a.roleId === b.roleId &&
        a.kind === b.kind &&
        subjectBlockEqual(a.subject, b.subject) &&
        realizersEqual(a.realizers, b.realizers) &&
        witnessesEqual(a.witnesses, b.witnesses));
}
/**
 * Compare two RelationBlock for equality.
 * Note: Relation order is normalized during rendering.
 */
function relationBlockEqual(a, b) {
    return (a.kind === b.kind &&
        a.source === b.source &&
        a.target === b.target);
}
/**
 * Deep equality comparison for two Workspaces.
 *
 * Used to verify R5.1 round-trip invariant:
 * parse(input) -> render -> parse should produce equal AST
 */
export function workspacesEqual(a, b) {
    if (a.name !== b.name)
        return false;
    if (a.items.length !== b.items.length)
        return false;
    // Compare items by type
    const aContexts = a.items.filter(i => i.tag === "ContextBlock");
    const bContexts = b.items.filter(i => i.tag === "ContextBlock");
    if (aContexts.length !== bContexts.length)
        return false;
    if (aContexts.length > 0) {
        const aEntries = [...aContexts[0].entries].sort((x, y) => x.key.localeCompare(y.key));
        const bEntries = [...bContexts[0].entries].sort((x, y) => x.key.localeCompare(y.key));
        if (!contextEntriesEqual(aEntries, bEntries))
            return false;
    }
    const aPersistence = a.items.filter(i => i.tag === "PersistenceClause");
    const bPersistence = b.items.filter(i => i.tag === "PersistenceClause");
    if (aPersistence.length !== bPersistence.length)
        return false;
    if (aPersistence.length > 0 && aPersistence[0].mode !== bPersistence[0].mode)
        return false;
    const aEquivalence = a.items.filter(i => i.tag === "EquivalenceClause");
    const bEquivalence = b.items.filter(i => i.tag === "EquivalenceClause");
    if (aEquivalence.length !== bEquivalence.length)
        return false;
    if (aEquivalence.length > 0 && aEquivalence[0].name !== bEquivalence[0].name)
        return false;
    const aRoles = a.items.filter(i => i.tag === "RoleBlock");
    const bRoles = b.items.filter(i => i.tag === "RoleBlock");
    if (aRoles.length !== bRoles.length)
        return false;
    // Sort both by roleId for comparison (since order is normalized)
    const aSortedRoles = [...aRoles].sort((x, y) => x.roleId.localeCompare(y.roleId));
    const bSortedRoles = [...bRoles].sort((x, y) => x.roleId.localeCompare(y.roleId));
    for (let i = 0; i < aSortedRoles.length; i++) {
        if (!roleBlockEqual(aSortedRoles[i], bSortedRoles[i]))
            return false;
    }
    const aRelations = a.items.filter(i => i.tag === "RelationBlock");
    const bRelations = b.items.filter(i => i.tag === "RelationBlock");
    if (aRelations.length !== bRelations.length)
        return false;
    // Sort both by tuple for comparison (since order is normalized)
    const tupleKey = (r) => `${r.kind}\t${r.source}\t${r.target}`;
    const aSortedRelations = [...aRelations].sort((x, y) => tupleKey(x).localeCompare(tupleKey(y)));
    const bSortedRelations = [...bRelations].sort((x, y) => tupleKey(x).localeCompare(tupleKey(y)));
    for (let i = 0; i < aSortedRelations.length; i++) {
        if (!relationBlockEqual(aSortedRelations[i], bSortedRelations[i]))
            return false;
    }
    return true;
}
//# sourceMappingURL=ast-equality.js.map