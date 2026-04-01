# Task 20260401-015: Kernel Semantic Introduction

**Objective**: Introduce a **minimal, explicit kernel object** for Themis so that downstream tasks stop depending on an implied or missing center.

---

## Current State

The corpus now has executable or planned population for:

- parser
- canonical rendering
- conservative composition
- explicit composition
- runtime integration
- durable runtime journal
- deployment envelope

However, the agent correctly identified a structural gap:

- multiple tasks refer to a **kernel**
- no explicit kernel lawbook exists
- no explicit kernel executable spec exists
- some downstream semantics currently rely on an implied central object

So the system is:

> locally structured, but missing its named semantic center

This task fixes that.

---

## Architectural Decision

The kernel is the **smallest semantic core** that all higher layers depend on.

It must define:

- the canonical semantic carriers
- the minimal well-formedness predicates
- the normalization surface
- the equality/equivalence basis
- the satisfaction surface used by runtime integration

It must be:

- explicit
- minimal
- closed enough to support later tasks
- smaller than the whole language/runtime stack

This task is not “implement the whole system core.”  
It is:

> make the kernel explicit so downstream work stops guessing

---

## Constraint

Do **not** absorb parser, rendering, or composition into kernel.

Do **not** re-express the full DSL here.

Do **not** introduce substrate/runtime mechanics into kernel.

The kernel is only about:

> semantic objects and their minimal invariants

---

## Scope

Define the minimal kernel carriers:

```ts
type Workspace
type Role
type Subject
type Relation
type Context
type PersistenceMode
type EquivalenceRef
```

and the minimal kernel operations:

```ts
wellFormed(workspace): boolean | Verdict
normalize(workspace): Workspace
equiv(a, b): boolean
satisfiedRole(workspace, facts, roleId): boolean
satisfiedWorkspace(workspace, facts): boolean
```

These must be explicit.

---

## Policy Decisions

### 1. Kernel is representation-independent

Kernel does **not** know:

- source formatting
- parser token boundaries
- comments
- file layout
- runtime backend specifics

It only knows semantic carriers.

---

### 2. Kernel is stricter than parser surface

Parser may accept surface syntax.
Kernel defines whether parsed/lowered objects are semantically admissible.

So:

- parsing success does not imply kernel validity
- lowering into kernel must still pass kernel well-formedness

---

### 3. Minimal carrier definitions

#### Workspace

Must contain:

- `id`
- `context`
- `persistence`
- `equivalence`
- `roles`
- `relations`

#### Role

Must contain:

- `id`
- `kind`
- `subject`
- at least one `realizer`
- at least one `witness`

#### Subject

Must contain:

- `identity`
- `reference`
- optional `locator`

---

### 4. Kernel well-formedness rules

At minimum:

#### Workspace
- non-empty `id`
- at least one role
- unique role ids
- unique subject identities unless explicit composition later permits otherwise
- all relation endpoints resolve to existing role ids

#### Role
- non-empty `id`
- non-empty `kind`
- valid subject
- at least one realizer
- at least one witness

#### Subject
- non-empty `identity`
- non-empty `reference`

---

### 5. Normalization rules

Kernel normalization must be deterministic.

At minimum it must:

- sort roles by `role.id`
- sort relations by `(kind, source, target)`
- sort context keys lexicographically
- preserve role-local realizer/witness order unless explicitly normalized later

This keeps normalization minimal.

---

### 6. Equivalence rules

For v0:

```text
equiv(a, b) := normalize(a) == normalize(b)
```

structural equality after normalization.

Do not introduce richer equivalence notions yet.

---

### 7. Satisfaction rules

For v0, kernel satisfaction must remain minimal and align with runtime integration.

#### satisfiedRole
A role is satisfied iff:
- its subject is observed
- one matching realizer is observed

#### satisfiedWorkspace
A workspace is satisfied iff:
- all roles are satisfied
- all declared relations are observed

This keeps the judgment surface explicit and central.

---

### 8. Kernel does not mutate

All kernel operations are pure:

- no writes
- no state
- no journal
- no runtime side-effects

---

## Deliverables

- [ ] Create explicit kernel lawbook
- [ ] Create explicit kernel executable spec
- [ ] Implement kernel carrier definitions
- [ ] Implement well-formedness checks
- [ ] Implement normalization
- [ ] Implement equivalence
- [ ] Implement satisfaction functions
- [ ] Replace kernel placeholders with real tests

---

## Required Law Families

### Law family K1 — Carrier laws
- workspace/role/subject/relation/context carriers are explicit
- required fields are explicit

### Law family K2 — Well-formedness laws
- invalid workspace/role/subject structures are rejected
- relation endpoints must resolve

### Law family K3 — Normalization laws
- deterministic ordering
- no semantic mutation beyond normalization

### Law family K4 — Equivalence laws
- normalized structural equality defines equivalence in v0

### Law family K5 — Satisfaction laws
- role satisfaction and workspace satisfaction are explicit and pure

---

## Test Plan

Implement tests for:

1. **well-formed minimal workspace passes**
2. **workspace with duplicate role ids fails**
3. **workspace with duplicate subject identities fails**
4. **workspace with missing relation endpoint fails**
5. **normalization sorts roles deterministically**
6. **normalization sorts relations deterministically**
7. **equiv holds for same workspace under reordered roles/relations/context**
8. **satisfiedRole true when subject and realizer facts match**
9. **satisfiedRole false when subject missing or realizer missing**
10. **satisfiedWorkspace true only when all roles and relations are satisfied**

These are the first true kernel tests.

---

## Required Output Shape

At minimum:

```ts
type KernelVerdict =
  | { ok: true }
  | { ok: false; errors: KernelError[] }
```

and:

```ts
type KernelError =
  | "DuplicateRoleId"
  | "DuplicateSubjectIdentity"
  | "MissingRelationEndpoint"
  | "MissingRoleRealizer"
  | "MissingRoleWitness"
  | "MissingSubjectIdentity"
  | "MissingSubjectReference"
```

You may refine error shape, but do not broaden semantics.

---

## Acceptance Criteria

- [ ] Kernel lawbook exists and contains explicit rules
- [ ] Kernel executable spec exists and contains real tests
- [ ] All 10 kernel tests above are implemented
- [ ] All kernel tests pass
- [ ] Kernel is pure and deterministic
- [ ] Downstream tasks can reference kernel explicitly instead of implicitly

---

## Non-Goals

- Do not redefine parser surface syntax
- Do not implement substrate/runtime machinery here
- Do not implement import/module language here
- Do not add advanced equivalence notions
- Do not add persistence side-effects

---

## Failure Policy

If current workspace/role/fact shapes are insufficient to define a stable kernel:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-015-kernel-semantic-introduction.questions.md
   ```
3. describe exact missing invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Several higher-layer tasks already depend on a kernel concept.

Without an explicit kernel, the corpus risks:

- hidden centrality
- duplicated semantics
- agent confusion
- non-local drift

This task makes the center explicit.

---

## Next Step

After completion:

- update downstream task references to point to actual kernel files
- rerun blocking analysis
- then continue with whichever of:
  - runtime integration
  - journal
  - envelope
  still needs to be aligned to explicit kernel semantics

---