/**
 * Kernel Types
 *
 * Minimal semantic carriers for Themis kernel.
 */
export type KernelWorkspace = {
    tag: "Workspace";
    id: string;
    context: Map<string, string>;
    persistence: string;
    equivalence: string;
    roles: KernelRole[];
    relations: KernelRelation[];
};
export type KernelRole = {
    tag: "Role";
    id: string;
    kind: string;
    subject: KernelSubject;
    realizers: KernelRealizer[];
    witnesses: KernelWitness[];
};
export type KernelSubject = {
    tag: "Subject";
    identity: string;
    reference: string;
    locator?: string;
};
export type KernelRealizer = {
    tag: "Realizer";
    class: string;
    payload: string;
};
export type KernelWitness = {
    tag: "Witness";
    class: string;
    payload: string;
};
export type KernelRelation = {
    tag: "Relation";
    kind: string;
    source: string;
    target: string;
};
export type KernelError = {
    type: "DuplicateRoleId";
    roleId: string;
} | {
    type: "DuplicateSubjectIdentity";
    subjectId: string;
} | {
    type: "MissingRelationEndpoint";
    relation: KernelRelation;
    endpoint: "source" | "target";
} | {
    type: "MissingRoleRealizer";
    roleId: string;
} | {
    type: "MissingRoleWitness";
    roleId: string;
} | {
    type: "MissingSubjectIdentity";
    roleId: string;
} | {
    type: "MissingSubjectReference";
    roleId: string;
} | {
    type: "EmptyWorkspaceId";
} | {
    type: "EmptyRoleId";
} | {
    type: "EmptyRoleKind";
    roleId: string;
} | {
    type: "NoRolesInWorkspace";
};
export type KernelVerdict = {
    ok: true;
} | {
    ok: false;
    errors: KernelError[];
};
export type SatisfactionResult = {
    satisfied: boolean;
    reasons: string[];
};
//# sourceMappingURL=kernel.d.ts.map