--- .ai/tasks/20260401-010-conservative-composition-semantic-population.md ---
# Task 20260401-010: Conservative Composition Semantic Population

**Objective**: Define and implement a **minimal, closed, conservative module/workspace composition semantics** for the currently populated subset, so that composition is executable, deterministic, and explicitly collision-failing.

---

## Current State

After parser and canonical rendering population:

- single-workspace parsing is concrete
- canonical rendering is concrete
- round-trip invariants exist for one workspace

However:

- composition remains only template-level or partial
- there is no machine-enforced rule for combining two or more workspaces
- collision handling is not yet executable

So the system is:

> single-object closed, multi-object still semantically open

This task fixes that.

---

## Architectural Decision

Conservative composition comes **before** explicit namespacing and shared-identity relaxation.

It must define the strict baseline:

- no silent merging
- no implicit namespace inference
- no implicit shared subject identity
- no persistence/equivalence weakening

This task defines:

> deterministic union only when no semantic collisions exist

---

## Constraint

Do **not** implement:

- explicit namespacing
- aliasing
- shared-identity declarations
- import syntax
- override semantics
- module registries

This task is only about:

> strict composition that either succeeds exactly or fails explicitly

---

## Scope

Input modules are `Workspace` objects in the already-populated subset.

Composition applies only to:

- workspace id
- context entries
- persistence
- equivalence
- roles
- relations

Out of scope:

- extension blocks
- imported modules
- namespaced roles
- cross-profile runtime migration
- operator state

---

## Policy Decisions

### 1. Canonical module ordering

Modules must be composed in deterministic lexical order by:

```text
moduleId
```

Input array order must not matter.

---

### 2. Workspace id collisions

If two modules have the same `workspace.id`, composition fails.

No implicit assumption of sameness.

---

### 3. Persistence agreement

All modules must have the same:

```text
workspace.persistence
```

Otherwise composition fails.

No strongest-mode or weakest-mode lattice is allowed.

---

### 4. Equivalence agreement

All modules must have the same:

```text
workspace.equivalence.name
```

Otherwise composition fails.

No compatibility guessing.

---

### 5. Role identity collisions

If two modules contain the same unqualified:

```text
role.id
```

composition fails.

No silent merging.

---

### 6. Subject identity collisions

If two modules contain the same:

```text
role.subject.identity
```

composition fails.

No implicit shared identity.

---

### 7. Context keys

If the same context key appears in multiple modules:

- if values are equal → dedup allowed
- if values differ → composition fails

No overwrite.

---

### 8. Relation endpoint resolution

After role union, every relation endpoint must resolve uniquely.

If any relation `source` or `target` does not resolve to exactly one composed role id:

- composition fails

No endpoint guessing.

---

### 9. Composed workspace id

If composition succeeds, composed workspace id is:

```text
<moduleId-1>+<moduleId-2>+...
```

using canonical module order.

This is deterministic and operational only.

---

### 10. Output ordering

If composition succeeds:

- roles sorted by `role.id`
- relations sorted lexicographically by `(kind, source, target)`
- context keys sorted lexicographically

---

## Deliverables

- [ ] Populate conservative composition lawbook with explicit rules
- [ ] Populate conservative composition executable spec with real tests
- [ ] Implement canonical module ordering
- [ ] Implement conflict detection
- [ ] Implement successful composition result
- [ ] Replace composition `todo` tests with real tests

---

## Required Law Families

### Law family C1 — Canonical ordering
- module order is deterministic
- output role/relation/context order is deterministic

### Law family C2 — Collision failure
- workspace id collisions fail
- role id collisions fail
- subject identity collisions fail
- unequal context values fail

### Law family C3 — Agreement rules
- persistence must agree exactly
- equivalence must agree exactly

### Law family C4 — Relation resolution
- every endpoint resolves uniquely after role union
- missing endpoints fail

### Law family C5 — Success shape
- successful composition produces one deterministic composed workspace

---

## Test Plan

Implement tests for:

1. **canonical module order ignores input order**
2. **workspace id collision fails**
3. **role id collision fails**
4. **subject identity collision fails**
5. **equal context values dedup**
6. **unequal context values fail**
7. **persistence disagreement fails**
8. **equivalence disagreement fails**
9. **missing relation endpoint fails**
10. **successful composition produces deterministic workspace id and sorted outputs**

These are the first true semantic composition tests.

---

## Required Output Shape

At minimum, successful composition returns:

```ts
type CompositionVerdict = {
  composed?: Workspace;
  admissible: boolean;
  conflicts: CompositionConflict[];
  notes?: string[];
};
```

with explicit conflict tags for:

- `WorkspaceIdCollision`
- `RoleIdCollision`
- `SubjectCollision`
- `ContextKeyCollision`
- `RelationEndpointMissing`
- `PersistenceModeConflict`
- `EquivalenceConflict`

Do not add more unless required.

---

## Acceptance Criteria

- [ ] Conservative composition lawbook contains explicit semantic rules
- [ ] Conservative composition executable spec contains real tests
- [ ] All 10 composition tests above are implemented
- [ ] All composition tests pass
- [ ] No implicit merge behavior exists
- [ ] Composition output is deterministic

---

## Non-Goals

- Do not implement namespacing
- Do not implement shared identities
- Do not add aliasing
- Do not invent merge semantics
- Do not add import syntax
- Do not support partial composition success

---

## Failure Policy

If current `Workspace` shape is insufficient for deterministic composition:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-010-conservative-composition-semantic-population.questions.md
   ```
3. describe exact missing invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Themis currently closes one workspace at a time.

Conservative composition is the first executable answer to:

> when may multiple semantic objects coexist without ambiguity?

It is the strict baseline that explicit composition may later relax—but only explicitly.

---

## Next Step

After completion:

- run composition tests
- update blocking report
- then decide whether the next semantic population target is:
  - explicit composition
  - or kernel, if kernel is finally made concrete

---