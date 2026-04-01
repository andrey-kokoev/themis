# Task 20260401-022: Operator Action Replay Compensation Semantics

**Objective**: Define and implement a **minimal, explicit compensation semantics** for replayable operator actions so that reversible human interventions can be counteracted by lawful, auditable follow-up actions instead of hidden mutation or deletion.

---

## Current State

After Task `20260401-018` and Task `20260401-021`:

- operator actions are explicit and bounded
- operator actions are journalable
- operator actions are replay-checked
- concrete backend realizations exist
- cross-backend parity constraints exist

However:

- replayable / reversible operator actions still lack an explicit compensation model
- “reversible” currently means only “not logically irreversible”
- there is no lawful way to express:
  - acknowledgment withdrawal
  - rebind cancellation
  - note retraction
- journal replay can detect inadmissibility, but cannot express compensating intent

So the system is:

> operator-governable, but not yet explicitly compensable

This task fixes that.

---

## Architectural Decision

Compensation is **not deletion**.

A compensating action must be:

- explicit
- journaled
- replayable
- auditable
- scoped to a prior reversible operator action

The rule is:

> if an operator action is reversible, reversal must occur through a later compensating action, never by mutating history

This task defines that protocol.

---

## Constraint

Do **not** implement:

- hard deletion from journal
- history rewriting
- arbitrary undo stack
- UI undo/redo
- multi-operator arbitration
- access control
- generalized transactional rollback

This task is only about:

> explicit, journal-safe compensation of a bounded subset of operator actions

---

## Scope

Start from the existing reversible operator actions:

- `AcknowledgeConflict`
- `RequestRebind`
- `RecordNote`

Introduce compensation actions:

```ts
type OperatorCompensationAction =
  | {
      tag: "WithdrawConflictAcknowledgment"
      workspaceId: string
      conflictTag: string
      compensatesSeq: number
    }
  | {
      tag: "CancelRebindRequest"
      roleId: string
      compensatesSeq: number
    }
  | {
      tag: "RetractNote"
      scope: "workspace" | "role"
      targetId: string
      compensatesSeq: number
    }
```

Extend the operator action union to include these.

---

## Policy Decisions

### 1. Compensation is forward-only

A compensation action must appear **after** the action it compensates.

It may not:
- precede it
- replace it
- delete it

So compensation is part of history, not a rewrite of history.

---

### 2. Compensation target must be exact

A compensation action must reference the exact original action by:

```ts
compensatesSeq
```

No fuzzy matching by:
- scope
- message text
- role id alone
- latest similar event

This is required for auditability.

---

### 3. Only reversible actions may be compensated

Compensation is admissible only if the target action was declared:

```ts
reversible: true
```

in the operator protocol semantics.

So:

- `RetryIntegration` is not compensable in this task
- `AcknowledgeConflict`, `RequestRebind`, `RecordNote` are compensable

---

### 4. Compensation does not erase semantic truth

Compensation affects only the **operator protocol layer**.

It does not:

- erase the original journal record
- erase the underlying integration conflict
- rewrite kernel truth
- assert success/failure of runtime state

Examples:

- `WithdrawConflictAcknowledgment` does **not** remove the conflict itself
- `CancelRebindRequest` does **not** assert that a rebind never happened operationally
- `RetractNote` does **not** erase audit history of the note

This is the main anti-cavity law.

---

### 5. Compensation admissibility

A compensation action is admissible iff:

- the target `compensatesSeq` exists
- the target action is compensable
- the compensation type matches the target action kind
- the target has not already been compensated by another compensation action of the same kind

No double compensation in v0.

---

### 6. Replay semantics

Replay must treat compensation as part of effective operator state.

That means:

- original action remains in history
- if later compensated, its protocol effect becomes inactive from compensation point onward
- replay of compensation before target action is invalid
- replay of compensation against missing sequence is invalid

So replay remains deterministic and auditable.

---

### 7. Effective operator state

Introduce a derived notion:

```ts
type EffectiveOperatorState = {
  acknowledgedConflicts: Array<{ workspaceId: string; conflictTag: string }>
  pendingRebindRequests: Array<{ roleId: string }>
  activeNotes: Array<{ scope: "workspace" | "role"; targetId: string; noteSeq: number }>
}
```

This state is reconstructed from journaled operator actions plus compensation actions.

It is:
- derived
- replayable
- non-source

---

### 8. Determinism

Given the same ordered action history:

```text
history -> same effective operator state
```

No heuristic cancellation.

---

## Deliverables

- [ ] Create operator action replay compensation lawbook
- [ ] Create operator compensation executable spec
- [ ] Extend operator action types with compensation actions
- [ ] Implement compensation admissibility evaluation
- [ ] Implement effective operator state reconstruction from action history
- [ ] Replace compensation-layer `todo` tests with real tests

---

## Required Law Families

### Law family C1 — Forward-only compensation
- compensation is append-only
- no history rewrite

### Law family C2 — Exact targeting
- compensation references exact `compensatesSeq`

### Law family C3 — Compensability
- only reversible actions may be compensated
- type must match target action kind

### Law family C4 — Effective-state reconstruction
- compensated actions become inactive in effective protocol state
- history remains intact

### Law family C5 — Non-erasure
- compensation never erases source, kernel truth, or historical records

---

## Runtime State Input

At minimum, compensation evaluation may assume access to:

```ts
type OperatorActionHistory = Array<{
  seq: number
  action: OperatorAction | OperatorCompensationAction
}>
```

You may derive effective state purely from this history.

Do not require richer orchestration state unless needed.

---

## Test Plan

Implement tests for:

1. **WithdrawConflictAcknowledgment is admissible only after matching acknowledgment**
2. **CancelRebindRequest is admissible only after matching rebind request**
3. **RetractNote is admissible only after matching note**
4. **compensation before target action is rejected**
5. **compensation of non-reversible action is rejected**
6. **double compensation of the same target is rejected**
7. **effective operator state excludes compensated acknowledgment**
8. **effective operator state excludes compensated rebind request**
9. **effective operator state excludes compensated note**
10. **history remains intact while effective state changes deterministically**

---

## Acceptance Criteria

- [ ] Compensation lawbook contains explicit semantic rules
- [ ] Compensation executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All compensation tests pass
- [ ] Compensation is append-only and deterministic
- [ ] No compensation action rewrites history or semantic truth

---

## Non-Goals

- Do not implement journal deletion
- Do not implement generalized undo/redo
- Do not implement operator identity/auth
- Do not implement concurrent compensation conflicts
- Do not implement runtime rollback of already-executed backend plans

---

## Failure Policy

If current operator action or journal structures are insufficient to reconstruct effective compensated state cleanly:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-022-operator-action-replay-compensation-semantics.questions.md
   ```
3. identify the exact missing invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Operator protocol introduced bounded intervention.  
Journal introduced durable history.

But without explicit compensation semantics, reversibility remains only a label.

This task makes reversibility:

> explicit, replay-safe, auditable, and non-destructive

---

## Next Step

After completion:

- rerun operator protocol and journal tests
- add compensation tests to the runner
- then choose whether the next frontier is:
  - journal retention / compaction semantics
  - richer import resolution semantics
  - or end-to-end scenario conformance across the whole parser → kernel → runtime → journal pipeline

---