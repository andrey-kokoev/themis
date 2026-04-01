/**
 * Operator Action Compensation Types
 *
 * Types for compensating reversible operator actions.
 * Law families C1-C4 from lawbook 048 (Task 022).
 */
import type { OperatorActionRecord } from "./journal.js";
/**
 * Compensation action variants.
 * Each compensates a specific reversible operator action.
 */
export type OperatorCompensationAction = WithdrawConflictAcknowledgmentAction | CancelRebindRequestAction | RetractNoteAction;
/**
 * Withdraw acknowledgment of a conflict.
 * Compensates: AcknowledgeConflict
 */
export type WithdrawConflictAcknowledgmentAction = {
    tag: "WithdrawConflictAcknowledgment";
    workspaceId: string;
    conflictTag: string;
    compensatesSeq: number;
};
/**
 * Cancel a rebind request.
 * Compensates: RequestRebind
 */
export type CancelRebindRequestAction = {
    tag: "CancelRebindRequest";
    roleId: string;
    compensatesSeq: number;
};
/**
 * Retract a previously recorded note.
 * Compensates: RecordNote
 */
export type RetractNoteAction = {
    tag: "RetractNote";
    scope: "workspace" | "role";
    targetId: string;
    compensatesSeq: number;
};
/**
 * Verdict for compensation action evaluation.
 */
export type CompensationVerdict = {
    tag: "Compensable";
} | {
    tag: "Inadmissible";
    reason: string;
};
/**
 * Runtime state for compensation evaluation.
 */
export type CompensationRuntimeState = {
    /** All operator action records in journal */
    operatorActions: OperatorActionRecord[];
    /** Already compensated action sequence numbers */
    compensatedSeqs: number[];
};
/**
 * Journal record for compensation actions.
 */
export type CompensationActionRecord = {
    tag: "CompensationAction";
    seq: number;
    at: number;
    action: OperatorCompensationAction;
    verdict: CompensationVerdict;
};
//# sourceMappingURL=operator-compensation.d.ts.map