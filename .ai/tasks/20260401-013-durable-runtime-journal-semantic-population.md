# Task 20260401-013: Durable Runtime Journal Semantic Population

**Objective**: Define and implement a **minimal, closed, append-only journal semantics** that records runtime inputs and integration verdicts with deterministic replay, without altering source.

---

## Current State

After runtime integration:

- workspace + facts → deterministic `IntegrationVerdict`
- no mutation of source
- no persistence model for runtime history

So the system is:

> evaluative, but not yet durably observable or replayable

This task fixes that.

---

## Architectural Decision

Journal is **record**, not source.

It must:

- append records (never mutate past)
- preserve input + verdict pairs
- support deterministic replay
- remain non-authoritative relative to `/policy/src` and `/policy/spec`

---

## Constraint

Do **not** implement:

- external storage engines
- distributed logs
- compaction
- retention policies
- access control
- streaming APIs

This task is only about:

> in-process append-only journal semantics + deterministic replay

---

## Scope

Records only the integration boundary:

```ts
type JournalRecord =
  | {
      tag: "IntegrationEvaluated"
      seq: number
      at: number              // logical timestamp (monotone counter, not wall time)
      workspaceHash: string   // hash of canonical rendering
      facts: Fact[]
      verdict: IntegrationVerdict
    }
```

Journal container:

```ts
type Journal = {
  records: JournalRecord[]
  nextSeq: number
}
```

---

## Policy Decisions

### 1. Append-only

- records are only appended
- no deletion
- no in-place mutation

---

### 2. Monotone sequence

- `seq` starts at 1
- increments by 1 per append
- strictly increasing

---

### 3. Logical time

- `at` is monotone integer
- derived from append order (not wall clock)
- strictly increasing with `seq`

---

### 4. Workspace identity

- `workspaceHash` is hash of canonical rendering string
- identical workspace → identical hash
- different canonical render → different hash

---

### 5. Deterministic replay

Given:

```ts
replay(journal)
```

must:

- re-run `integrate(workspace, facts)` for each record
- reproduce the exact same `verdict`
- verify equality with stored verdict

Mismatch → replay failure

---

### 6. Replay modes

Define:

```ts
type ReplayResult = {
  ok: boolean
  firstFailureSeq?: number
}
```

- `ok = true` if all records match
- else fail at first mismatch

---

### 7. Non-authoritative rule

Journal must not:

- alter workspace
- introduce new facts
- affect admissibility logic

It is observational only.

---

### 8. Determinism requirement

Appending the same `(workspace, facts)` twice produces:

- two distinct records (different seq)
- identical `workspaceHash`
- identical `verdict`

---

### 9. Equality definition

Replay comparison requires:

- exact structural equality of `IntegrationVerdict`
- order-insensitive comparison for fact arrays if needed (but preserve input order as recorded)

---

## Deliverables

- [ ] Populate journal lawbook with explicit semantics
- [ ] Populate journal executable spec with real tests
- [ ] Implement `append(journal, workspace, facts)` function
- [ ] Implement `replay(journal, workspaceResolver)` function
- [ ] Replace journal `todo` tests with real tests
- [ ] Ensure deterministic behavior

---

## Required Law Families

### Law family J1 — Append-only
- no mutation or deletion of past records

### Law family J2 — Sequencing
- strictly increasing `seq`
- strictly increasing logical `at`

### Law family J3 — Identity
- `workspaceHash` derived from canonical render

### Law family J4 — Replay correctness
- recomputed verdict must equal stored verdict
- mismatch is failure

### Law family J5 — Non-authority
- journal does not influence integration semantics

---

## Test Plan

Implement tests for:

1. **append creates first record with seq=1**
2. **append increments seq deterministically**
3. **logical time increases with seq**
4. **same workspace yields same hash across records**
5. **different workspace yields different hash**
6. **replay succeeds for valid journal**
7. **replay detects tampered verdict**
8. **replay detects mismatch if integration logic changes**
9. **append does not mutate previous records**
10. **duplicate (workspace,facts) produces distinct records with same verdict**

---

## Helper Requirements

Provide:

```ts
function hashWorkspace(workspace: Workspace): string
```

using canonical rendering as input.

No cryptographic guarantees required—stable hash is sufficient.

---

## Acceptance Criteria

- [ ] Journal lawbook contains explicit semantic rules
- [ ] Journal executable spec contains real tests
- [ ] All 10 journal tests above are implemented
- [ ] All journal tests pass
- [ ] Replay is deterministic
- [ ] Journal remains non-authoritative

---

## Non-Goals

- Do not implement persistence backend
- Do not implement log compaction
- Do not implement retention/TTL
- Do not expose streaming APIs
- Do not integrate with external systems
- Do not introduce timestamps from system clock

---

## Failure Policy

If integration verdict or workspace identity is insufficient to support replay:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-013-durable-runtime-journal-semantic-population.questions.md
   ```
3. describe exact missing invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Runtime integration answers:

> what is admissible now?

Journal answers:

> what happened, and can we prove it again?

This establishes:

> reproducible operational history without contaminating source

---

## Next Step

After completion:

- run journal tests
- update blocking report
- then proceed to:
  - deployment envelope semantics
  - or kernel, if introduced

---