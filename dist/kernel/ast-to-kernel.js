/**
 * AST to Kernel Converter
 *
 * Converts surface AST Workspace to KernelWorkspace for kernel operations.
 * This is the bridge layer that enables downstream modules to use explicit kernel semantics.
 */
/**
 * Convert AST Workspace to KernelWorkspace.
 *
 * This projection extracts the semantic core needed for kernel operations.
 * It intentionally loses surface-level details (e.g., source location) that
 * don't affect semantic satisfaction.
 */
export function toKernelWorkspace(workspace) {
    // Extract context from ContextBlock
    const context = new Map();
    const contextBlocks = workspace.items.filter((i) => i.tag === "ContextBlock");
    for (const block of contextBlocks) {
        for (const entry of block.entries) {
            if (!context.has(entry.key)) {
                context.set(entry.key, entry.value);
            }
        }
    }
    // Extract persistence mode
    const persistenceClause = workspace.items.find(i => i.tag === "PersistenceClause");
    const persistence = persistenceClause?.mode || "session";
    // Extract equivalence mode
    const equivalenceClause = workspace.items.find(i => i.tag === "EquivalenceClause");
    const equivalence = equivalenceClause?.name || "strict";
    // Convert roles
    const roles = [];
    for (const item of workspace.items) {
        if (item.tag === "RoleBlock") {
            roles.push(toKernelRole(item));
        }
    }
    // Convert relations
    const relations = [];
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
function toKernelRole(roleBlock) {
    const realizers = roleBlock.realizers.map(r => ({
        tag: "Realizer",
        class: r.class,
        payload: r.payload,
    }));
    const witnesses = roleBlock.witnesses.map(w => ({
        tag: "Witness",
        class: w.class,
        payload: w.payload,
    }));
    const subject = {
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
//# sourceMappingURL=ast-to-kernel.js.map