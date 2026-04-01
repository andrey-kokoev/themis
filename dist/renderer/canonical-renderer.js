/**
 * Canonical Renderer for Themis AST
 *
 * Implements rendering laws R1-R5 from lawbook 028.
 * Produces deterministic, idempotent canonical form.
 */
class RenderError extends Error {
    constructor(message) {
        super(message);
        this.name = "RenderError";
    }
}
function assertNever(x) {
    throw new RenderError(`Unexpected node type: ${JSON.stringify(x)}`);
}
/**
 * Render a Workspace AST to canonical string form.
 *
 * Law R1: Uniqueness - each AST has exactly one canonical form
 * Law R3: Ordering - enforced via sorting where applicable
 */
export function render(workspace) {
    const lines = [];
    // R3.1: Workspace header
    lines.push(`workspace "${workspace.name}" {`);
    // Separate items by type
    const contextBlocks = [];
    const persistenceClauses = [];
    const equivalenceClauses = [];
    const roleBlocks = [];
    const relationBlocks = [];
    for (const item of workspace.items) {
        switch (item.tag) {
            case "ContextBlock":
                contextBlocks.push(item);
                break;
            case "PersistenceClause":
                persistenceClauses.push(item);
                break;
            case "EquivalenceClause":
                equivalenceClauses.push(item);
                break;
            case "RoleBlock":
                roleBlocks.push(item);
                break;
            case "RelationBlock":
                relationBlocks.push(item);
                break;
            default: assertNever(item);
        }
    }
    // Render context (R3.1: comes first after header)
    if (contextBlocks.length > 0) {
        lines.push(...renderContextBlock(contextBlocks[0], 1));
    }
    // Render persistence (R3.1)
    if (persistenceClauses.length > 0) {
        lines.push(...renderPersistenceClause(persistenceClauses[0], 1));
    }
    // Render equivalence (R3.1)
    if (equivalenceClauses.length > 0) {
        lines.push(...renderEquivalenceClause(equivalenceClauses[0], 1));
        lines.push(""); // F4: blank line after equivalence
    }
    // R3.3: Sort roles by roleId
    const sortedRoles = [...roleBlocks].sort((a, b) => a.roleId.localeCompare(b.roleId));
    for (let i = 0; i < sortedRoles.length; i++) {
        lines.push(...renderRoleBlock(sortedRoles[i], 1));
        // F4: blank line between roles (except after last if no relations)
        if (i < sortedRoles.length - 1 || relationBlocks.length > 0) {
            lines.push("");
        }
    }
    // R3.6: Sort relations by (kind, source, target)
    const sortedRelations = [...relationBlocks].sort((a, b) => {
        const tupleA = `${a.kind}\t${a.source}\t${a.target}`;
        const tupleB = `${b.kind}\t${b.source}\t${b.target}`;
        return tupleA.localeCompare(tupleB);
    });
    for (const relation of sortedRelations) {
        lines.push(...renderRelationBlock(relation, 1));
    }
    // R3.1: Closing brace
    lines.push("}");
    return lines.join("\n");
}
function indent(level) {
    return "  ".repeat(level); // F1: 2 spaces
}
function renderContextBlock(block, level) {
    const lines = [];
    lines.push(`${indent(level)}context {`);
    // R3.2: Sort entries by key
    const sortedEntries = [...block.entries].sort((a, b) => a.key.localeCompare(b.key));
    for (const entry of sortedEntries) {
        lines.push(`${indent(level + 1)}"${entry.key}" "${entry.value}"`);
    }
    lines.push(`${indent(level)}}`);
    return lines;
}
function renderPersistenceClause(clause, level) {
    return [`${indent(level)}persistence "${clause.mode}"`];
}
function renderEquivalenceClause(clause, level) {
    return [`${indent(level)}equivalence "${clause.name}"`];
}
function renderRoleBlock(block, level) {
    const lines = [];
    lines.push(`${indent(level)}role "${block.roleId}" {`);
    // R3.4: Inside role order: kind, subject, realizers, witnesses
    lines.push(`${indent(level + 1)}kind "${block.kind}"`);
    lines.push(...renderSubjectBlock(block.subject, level + 1));
    // R3.4: Realizers in source order
    for (const realizer of block.realizers) {
        lines.push(...renderRealizerBlock(realizer, level + 1));
    }
    // R3.4: Witnesses in source order
    for (const witness of block.witnesses) {
        lines.push(...renderWitnessBlock(witness, level + 1));
    }
    lines.push(`${indent(level)}}`);
    return lines;
}
function renderSubjectBlock(block, level) {
    const lines = [];
    lines.push(`${indent(level)}subject {`);
    // R3.5: Inside subject order: identity, reference, locator
    lines.push(`${indent(level + 1)}identity "${block.identity}"`);
    lines.push(`${indent(level + 1)}reference "${block.reference}"`);
    if (block.locator !== undefined) {
        lines.push(`${indent(level + 1)}locator "${block.locator}"`);
    }
    lines.push(`${indent(level)}}`);
    return lines;
}
function renderRealizerBlock(block, level) {
    return [`${indent(level)}realizer "${block.class}" "${block.payload}"`];
}
function renderWitnessBlock(block, level) {
    return [`${indent(level)}witness "${block.class}" "${block.payload}"`];
}
function renderRelationBlock(block, level) {
    return [`${indent(level)}relation "${block.kind}" "${block.source}" "${block.target}"`];
}
//# sourceMappingURL=canonical-renderer.js.map