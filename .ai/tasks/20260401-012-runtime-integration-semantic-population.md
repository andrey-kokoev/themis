# Task 20260401-012: Runtime Integration Semantic Population

**Objective**: Define and implement a **minimal, closed runtime integration semantics** that evaluates observed facts against a composed workspace and produces a deterministic **admissibility verdict** without mutating source.

---

## Current State

After composition layers:

- parser is concrete (subset)
- canonical rendering is deterministic
- conservative composition is strict and executable
- explicit composition allows controlled relaxation

However:

- there is no executable semantics for **observed facts**
- no integration of runtime state with declared law
- no admissibility decision procedure

So the system is:

> declarative and composable, but not yet evaluative

This task fixes that.

---

## Architectural Decision

Runtime integration is **judgment**, not mutation.

It must:

- take a composed `Workspace`
- take a set of **facts** (observations)
- evaluate them against declared roles/relations
- produce a deterministic verdict:
  - admissible / not admissible
  - with explicit conflicts

It must **not**:
- mutate source
- invent facts
- resolve ambiguity heuristically

---

## Constraint

Do **not** implement:

- persistence side-effects
- buffering / logs
- retries
- external I/O
- time-dependent behavior
- reconciliation loops

This task is only about:

> single-pass evaluation of facts against law

---

## Scope

Inputs:

```ts
type RuntimeInput = {
  workspace: Workspace
  facts: Fact[]
}
```

Outputs:

```ts
type IntegrationVerdict = {
  admissible: boolean
  conflicts: IntegrationConflict[]
  satisfied: string[]        // role ids satisfied
  unsatisfied: string[]      // role ids expected but not satisfied
}
```

---

## Fact Model (minimal)

Define a minimal fact shape:

```ts
type Fact =
  | {
      tag: "SubjectObserved"
      subjectId: string
      reference?: string
      locator?: string
    }
  | {
      tag: "RoleRealized"
      roleId: string
      realizerClass: string
      payload: string
    }
  | {
      tag: "RelationObserved"
      kind: string
      source: string
      target: string
    }
```

Do not extend beyond this set in this task.

---

## Policy Decisions

### 1. Closed-world role expectation

Every `role` in workspace defines an expectation.

A role is **satisfied** iff:

- its `subject.identity` is observed
- at least one matching `realizer` is observed

Otherwise:
- role is unsatisfied

---

### 2. Subject observation matching

A `SubjectObserved` fact matches a role iff:

```text
fact.subjectId == role.subject.identity
```

Reference/locator are advisory in this task (not required to match).

---

### 3. Realizer matching

A `RoleRealized` fact matches a role iff:

```text
fact.roleId == role.id
AND
fact.realizerClass == role.realizer.class
```

Payload is not validated in this task.

---

### 4. Witness requirement (minimal)

A role requires at least one `witness` declaration.

For this task, witness is considered satisfied if:

- at least one `RoleRealized` fact matched the role

(No independent witness fact type yet.)

---

### 5. Relation validation

For each declared relation:

- if a corresponding `RelationObserved` fact exists → satisfied
- if missing → conflict

For each observed relation:

- if not declared → conflict

---

### 6. Unknown role facts

If a `RoleRealized` fact references a role id not present in workspace:

- conflict: `UnknownRole`

---

### 7. Unknown subject facts

If a `SubjectObserved` fact references a subject id not present in any role:

- conflict: `UnknownSubject`

---

### 8. Admissibility rule

Integration is admissible iff:

- no conflicts exist
- all roles are satisfied
- all declared relations are satisfied

---

### 9. Determinism

Given same inputs:

```text
workspace + facts → same verdict
```

No ordering sensitivity in facts.

---

## Deliverables

- [ ] Populate runtime integration lawbook with explicit rules
- [ ] Populate runtime integration executable spec with real tests
- [ ] Implement `integrate(workspace, facts)` function
- [ ] Replace integration `todo` tests with real tests
- [ ] Ensure deterministic behavior

---

## Required Law Families

### Law family I1 — Role satisfaction
- role satisfaction requires subject + realizer
- missing → unsatisfied

### Law family I2 — Fact matching
- subject matching by identity
- realizer matching by role id + class

### Law family I3 — Relation correctness
- declared relations must be observed
- observed relations must be declared

### Law family I4 — Unknown fact detection
- unknown role → conflict
- unknown subject → conflict

### Law family I5 — Admissibility
- no conflicts
- all roles satisfied
- all relations satisfied

---

## Test Plan

Implement tests for:

1. **minimal valid workspace with matching facts is admissible**
2. **missing subject observation makes role unsatisfied**
3. **missing realizer makes role unsatisfied**
4. **unknown role in fact produces conflict**
5. **unknown subject produces conflict**
6. **declared relation missing in facts produces conflict**
7. **observed relation not declared produces conflict**
8. **all roles satisfied but relation missing → not admissible**
9. **all constraints satisfied → admissible**
10. **determinism with reordered facts**

---

## Conflict Types

At minimum:

- `UnknownRole`
- `UnknownSubject`
- `MissingRoleRealization`
- `MissingRelation`
- `UnexpectedRelation`

Do not add more unless required.

---

## Acceptance Criteria

- [ ] Runtime integration lawbook contains explicit semantic rules
- [ ] Runtime integration executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All integration tests pass
- [ ] Integration is deterministic
- [ ] No mutation of source occurs

---

## Non-Goals

- Do not implement persistence side-effects
- Do not implement replay or journaling
- Do not validate payload contents deeply
- Do not implement partial satisfaction scoring
- Do not implement retries or scheduling
- Do not integrate external systems

---

## Failure Policy

If current AST/workspace structure is insufficient to evaluate roles/facts:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-012-runtime-integration-semantic-population.questions.md
   ```
3. describe exact missing invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Parser answers:
> what is valid syntax?

Composition answers:
> what may coexist?

Runtime integration answers:
> what is actually happening and is it acceptable?

This is the first executable **judgment layer**.

---

## Next Step

After completion:

- run integration tests
- update blocking report
- then proceed to:
  - durable runtime journal
  - or deployment envelope
  - or kernel, if introduced

---