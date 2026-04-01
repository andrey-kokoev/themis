# Task 20260401-016: Kernel Alignment and Downstream Rebinding

**Objective**: Rebind already-populated downstream semantics to the newly introduced explicit kernel so that no layer depends on an implied center anymore.

---

## Current State

After Task `20260401-015`:

- an explicit kernel exists
- kernel carriers, well-formedness, normalization, equivalence, and satisfaction are defined
- kernel executable tests exist

However, several downstream layers were originally written against an **implicit** or **provisional** center:

- runtime integration
- conservative composition
- explicit composition
- canonical rendering
- durable runtime journal
- deployment envelope

So the system is:

> explicit at the center, but not yet fully rebound around that center

This task fixes that.

---

## Architectural Decision

This is a **rebinding** task, not a semantic expansion task.

The rule is:

> if a downstream layer currently duplicates, implies, or shadows kernel semantics, it must be rewritten to depend on kernel explicitly.

This task must:

- remove duplicated core checks
- route downstream judgments through kernel where appropriate
- preserve existing behavior unless it conflicts with explicit kernel law

---

## Constraint

Do **not** invent new semantics.

Do **not** broaden kernel.

Do **not** rewrite parser subset, substrate behavior, or journal scope beyond what kernel alignment requires.

This task is only about:

> replacing hidden center assumptions with explicit kernel dependencies

---

## Scope

Rebind these downstream objects:

1. runtime integration
2. conservative composition
3. explicit composition
4. canonical rendering
5. durable runtime journal
6. deployment envelope

---

## Policy Decisions

### 1. Runtime integration must use kernel satisfaction

Runtime integration must no longer define role/workspace admissibility independently if kernel already defines:

- `satisfiedRole(...)`
- `satisfiedWorkspace(...)`

Allowed:
- runtime integration may still detect runtime-specific conflicts
- final satisfaction decision must flow through kernel

---

### 2. Composition must emit kernel-valid workspaces

Both conservative and explicit composition must:

- produce `Workspace`
- run kernel well-formedness on composed result
- fail if kernel rejects the composed workspace

So composition success now means:

```text
no composition conflicts
AND
kernel well-formedness passes
```

---

### 3. Rendering must target kernel truth explicitly

Canonical rendering must distinguish clearly:

- surface/explicit rendering
- kernel-normalized rendering

Kernel-normalized rendering must be defined as projection from explicit kernel object, not from inferred semantics.

---

### 4. Journal replay must compare kernel-aligned judgments

If journal stores integration verdicts, replay validation must compare verdicts derived through the current kernel-aligned path.

It must not preserve an older pre-kernel local interpretation if that differs from explicit kernel semantics.

---

### 5. Envelope must classify kernel as authoritative source

Deployment envelope and scaffold must explicitly include kernel files as part of authoritative source.

No ambiguity about whether kernel is:
- source
- generated
- derived

It is source.

---

### 6. No duplicated core predicates

Downstream code must not keep independent versions of:

- role satisfaction
- workspace satisfaction
- semantic equivalence
- normalization ordering

If needed, downstream layers call kernel.

---

## Deliverables

- [ ] Audit downstream layers for duplicated/implied kernel semantics
- [ ] Rebind runtime integration to explicit kernel satisfaction
- [ ] Rebind conservative composition to kernel well-formedness
- [ ] Rebind explicit composition to kernel well-formedness
- [ ] Rebind canonical kernel-normalized rendering to explicit kernel object
- [ ] Rebind journal replay to kernel-aligned integration
- [ ] Update envelope/scaffold/source classification to name kernel explicitly
- [ ] Add/replace executable tests for all rebinding points

---

## Required Law Families

### Law family A1 — Single center
- downstream layers must not shadow kernel semantics

### Law family A2 — Kernel-mediated judgment
- satisfaction flows through kernel
- composition validity flows through kernel

### Law family A3 — Kernel-authored normalization/equivalence
- normalization/equivalence used downstream are kernel ones

### Law family A4 — Kernel source authority
- kernel is authoritative source in repo/envelope classification

### Law family A5 — Behavior preservation under rebinding
- rebinding should preserve downstream behavior except where prior behavior conflicts with explicit kernel law

---

## Test Plan

Implement tests for:

1. **runtime integration uses kernel satisfiedRole**
2. **runtime integration uses kernel satisfiedWorkspace**
3. **conservative composition fails if kernel well-formedness fails**
4. **explicit composition fails if kernel well-formedness fails**
5. **kernel-normalized render consumes explicit kernel workspace**
6. **journal replay validates verdicts through kernel-aligned integration**
7. **envelope classifies kernel as authoritative source**
8. **no duplicated normalization helper remains in downstream modules**
9. **no duplicated equivalence helper remains in downstream modules**
10. **rebinding preserves previously valid downstream cases where consistent with kernel**

---

## Acceptance Criteria

- [ ] All audited downstream layers reference explicit kernel where required
- [ ] No independent duplicated core predicates remain
- [ ] Rebinding tests pass
- [ ] Existing valid behavior remains stable unless explicit kernel law invalidates it
- [ ] Agent can point to one explicit semantic center

---

## Non-Goals

- Do not introduce new runtime facts
- Do not expand parser subset
- Do not implement additional substrate behavior
- Do not change lawbook ordering
- Do not broaden journal storage model

---

## Failure Policy

If a downstream layer cannot be rebound cleanly because the kernel is still insufficient:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-016-kernel-alignment-and-downstream-rebinding.questions.md
   ```
3. identify the exact missing kernel invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Introducing a kernel is not enough.

Until downstream layers are explicitly rebound to it, the system still has:

- duplicated semantics
- hidden centers
- agent confusion
- non-local drift

This task makes the kernel real **for the rest of the corpus**, not just in isolation.

---

## Next Step

After completion:

- regenerate blocking report
- update INDEX/CLOSURE if needed
- then choose whether the next frontier is:
  - operator protocol semantics
  - import/module surface syntax
  - or concrete backend realization

---