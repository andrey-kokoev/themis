# Task 20260401-014: Deployment Envelope Semantic Population

**Objective**: Define and implement a **minimal, closed deployment envelope semantics** that classifies repository artifacts into authoritative vs non-authoritative domains and enforces the pipeline boundaries between them.

---

## Current State

After journal population:

- parser → canonical render → composition → integration → journal
- system has:
  - declarative law
  - executable evaluation
  - durable observation

However:

- repository boundaries are not enforced semantically
- source vs generated vs runtime artifacts are not machine-checked
- pipeline stages are not validated

So the system is:

> semantically rich but operationally unguarded

This task fixes that.

---

## Architectural Decision

Deployment envelope defines:

> what is allowed to exist, where, and with what authority

It must:

- classify directories
- enforce read/write rules
- validate pipeline transitions
- ensure reproducibility

It must not:

- perform runtime logic
- execute business semantics
- mutate source

---

## Constraint

Do **not** implement:

- CI/CD integration
- packaging formats
- containerization
- cloud deployment
- file watchers

This task is only about:

> repository structure + artifact classification + pipeline validation

---

## Scope

Applies to repository root:

```text
/policy
  /src
  /spec
  /generated
  /dist
  /state
  /cache
```

---

## Policy Decisions

### 1. Authority classification

Define:

| directory | authority | rule |
|----------|----------|------|
| /policy/src | authoritative | must not be generated |
| /policy/spec | authoritative | must not be generated |
| /policy/generated | non-authoritative | must be reproducible |
| /policy/dist | non-authoritative | must be reproducible |
| /policy/state | non-authoritative | runtime-only |
| /policy/cache | non-authoritative | disposable |

---

### 2. Write rules

- `/src` and `/spec`:
  - may only be modified by human or agent tasks explicitly
  - must not be written by runtime or pipeline steps

- `/generated` and `/dist`:
  - may be written by pipeline only
  - must be derivable from authoritative inputs

- `/state`:
  - may be written only by runtime (journal)
  - must not be used as source

- `/cache`:
  - may be written by any process
  - must be safely deletable

---

### 3. Pipeline stages

Define pipeline:

```text
parse → lower → validate → normalize → render → integrate → journal
```

Mapping:

| stage | reads | writes |
|------|------|--------|
| parse/lower/validate/normalize | /src, /spec | in-memory |
| render | AST | /generated |
| integrate | workspace + facts | in-memory |
| journal | verdict | /state |

No stage may:
- write to `/src` or `/spec`
- read from `/state` as source

---

### 4. Reproducibility rule

Everything in:

- `/generated`
- `/dist`

must be reproducible from:

```text
/src + /spec
```

If not:
- violation

---

### 5. State isolation rule

- `/state` must not influence:
  - parsing
  - rendering
  - composition
  - integration logic

It is observational only.

---

### 6. Cache disposability rule

Deleting `/cache` must not:

- change any authoritative result
- change generated output correctness

---

### 7. No implicit coupling

No code may:

- import from `/generated` into `/src`
- import from `/state` into semantic layers

---

## Deliverables

- [ ] Populate deployment envelope lawbook with explicit rules
- [ ] Populate deployment envelope executable spec with real tests
- [ ] Implement repository validator:
  ```ts
  validateRepo(rootPath): EnvelopeVerdict
  ```
- [ ] Replace envelope `todo` tests with real tests
- [ ] Ensure violations are detectable

---

## Required Law Families

### Law family D1 — Authority
- classify directories strictly
- prevent cross-boundary writes

### Law family D2 — Pipeline correctness
- each stage reads/writes allowed domains only

### Law family D3 — Reproducibility
- generated/dist must be derivable

### Law family D4 — Isolation
- state does not affect semantics
- cache is disposable

### Law family D5 — Coupling
- no illegal cross-imports

---

## Envelope Verdict

Define:

```ts
type EnvelopeVerdict = {
  valid: boolean
  violations: EnvelopeViolation[]
}
```

Violation types:

- `IllegalWriteToSource`
- `NonReproducibleArtifact`
- `StateUsedAsSource`
- `IllegalCrossImport`
- `CacheAffectsSemantics`

---

## Test Plan

Implement tests for:

1. **writing to /generated allowed**
2. **writing to /src detected as violation**
3. **generated file missing source derivation fails**
4. **state file used as source fails**
5. **cache deletion does not affect output**
6. **illegal import from /generated to /src fails**
7. **pipeline stage writes to correct location**
8. **journal writes only to /state**
9. **render writes only to /generated**
10. **valid repo passes validation**

---

## Acceptance Criteria

- [ ] Envelope lawbook contains explicit rules
- [ ] Envelope executable spec contains real tests
- [ ] Repository validator implemented
- [ ] All envelope tests pass
- [ ] Violations detected deterministically
- [ ] No implicit coupling remains

---

## Non-Goals

- Do not integrate with CI
- Do not define packaging formats
- Do not implement deployment scripts
- Do not enforce OS-level permissions
- Do not add security model

---

## Failure Policy

If repository layout or tooling prevents clear classification:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-014-deployment-envelope-semantic-population.questions.md
   ```
3. describe exact ambiguity
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Everything so far defines:

> what the system means

Deployment envelope defines:

> where that meaning is allowed to live and how it flows

Without this, correctness is not enforceable in practice.

---

## Next Step

After completion:

- run envelope validation tests
- update blocking report
- then decide whether to:
  - introduce kernel semantics
  - or stabilize coverage and invariants across the corpus

---