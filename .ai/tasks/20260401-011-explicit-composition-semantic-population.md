# Task 20260401-011: Explicit Composition Semantic Population

**Objective**: Define and implement a **minimal, closed, explicit-relaxation composition semantics** that permits safe reuse of local role ids and safe shared subject identity **only through explicit declarations**, never by coincidence.

---

## Current State

After conservative composition population:

- strict composition is executable
- collisions fail deterministically
- no implicit merge behavior exists

However:

- there is still no executable path for intentional reuse
- namespacing is not operational
- aliasing is not operational
- shared subject identity is still always illegal

So the system is:

> safely strict, but not yet explicitly extensible

This task fixes that.

---

## Architectural Decision

Explicit composition must come **after** conservative composition.

It is not a replacement.  
It is a controlled relaxation layer.

This task must define:

- explicit namespace declarations
- explicit role alias declarations
- explicit shared-identity declarations
- lifted role-id resolution
- relation endpoint resolution after lifting

The rule is:

> only explicit declarations may relax strict composition

---

## Constraint

Do **not** implement:

- import syntax
- wildcard imports
- export visibility
- override semantics
- automatic namespace inference
- automatic alias inference
- automatic shared-identity inference

This task is only about:

> explicit policy-driven relaxation of conservative composition

---

## Scope

Input:

- multiple `ModuleRef`
- one `ExplicitCompositionPolicy`

Output:

- one composed workspace or explicit failure

This task applies only to the already-populated subset:

- workspace id
- persistence
- equivalence
- roles
- subjects
- relations
- context values

Out of scope:

- extensions
- module language surface syntax
- registries
- version graphs
- runtime/profile migration

---

## Policy Decisions

### 1. Namespace declarations are explicit

If namespacing is used, every namespace must be declared explicitly:

```ts
type NamespaceDecl = {
  moduleId: string
  namespace: string
}
```

No inference from:
- module id
- workspace id
- path
- repo structure

---

### 2. Namespace uniqueness is required

Two modules may not declare the same namespace.

If they do:
- composition fails

---

### 3. Role aliasing is explicit

Role aliasing is:

```ts
type RoleAliasDecl = {
  moduleId: string
  localRoleId: string
  composedRoleId: string
}
```

No alias may be inferred from spelling similarity.

---

### 4. Lifted role-id rule

For `(moduleId, localRoleId)`:

1. if exact alias exists → use alias target
2. else if module has explicit namespace → use:
   ```text
   <namespace>::<localRoleId>
   ```
3. else use raw local role id

This rule is mandatory and deterministic.

---

### 5. Alias collisions fail

If two lifted roles land on the same `composedRoleId`, composition fails.

No implicit merge.

---

### 6. Shared subject identity is explicit only

Shared subject identity is legal only through:

```ts
type SharedIdentityDecl = {
  subjectId: string
  modules: string[]
}
```

It must match:

- exact subject id
- exact set of participating modules

Otherwise:
- composition fails

---

### 7. Shared identity does not merge roles

Even when subject identity is declared shared:

- roles remain distinct unless also lifted distinctly
- shared referent is not role merge

---

### 8. Persistence and equivalence remain strict

Explicit composition does **not** relax:

- persistence agreement
- equivalence agreement

Any disagreement still fails composition.

---

### 9. Relation resolution happens after lifting

Relations must be resolved in the **lifted composed role-id space**.

If after lifting any endpoint is:
- ambiguous
- unresolved

composition fails.

No guessing.

---

## Deliverables

- [ ] Populate explicit composition lawbook with actual semantic rules
- [ ] Populate explicit composition executable spec with real tests
- [ ] Implement policy validation
- [ ] Implement lifted role-id computation
- [ ] Implement shared-identity validation
- [ ] Implement explicit composition result
- [ ] Replace explicit composition `todo` tests with real tests

---

## Required Law Families

### Law family E1 — Namespace laws
- namespaces are explicit
- namespaces are unique
- no inferred namespaces

### Law family E2 — Alias laws
- aliases are explicit
- lifting rule is deterministic
- alias collisions fail

### Law family E3 — Shared-identity laws
- shared subject identity illegal by default
- legal only by exact declaration
- declaration must match exact module set

### Law family E4 — Relation resolution laws
- relation endpoints resolve after lifting
- ambiguity fails
- missing endpoints fail

### Law family E5 — Strictness preservation laws
- persistence agreement remains strict
- equivalence agreement remains strict

---

## Test Plan

Implement tests for:

1. **explicit namespaces allow same local role id without collision**
2. **same namespace used by two modules fails**
3. **lifted role-id rule follows alias > namespace > raw**
4. **alias collision on same composed role id fails**
5. **shared subject identity without declaration fails**
6. **shared subject identity with exact declaration succeeds**
7. **invalid shared identity declaration fails**
8. **relation endpoints resolve after lifting**
9. **ambiguous relation endpoint after lifting fails**
10. **persistence/equivalence disagreement still fails under explicit policy**

These are the first true semantic explicit-composition tests.

---

## Required Output Shape

At minimum:

```ts
type NamespacedCompositionVerdict = {
  composed?: Workspace
  admissible: boolean
  conflicts: NamespacedCompositionConflict[]
  notes?: string[]
}
```

with explicit conflict tags including:

- `NamespaceCollision`
- `AliasCollision`
- `UndeclaredSharedIdentity`
- `InvalidSharedIdentityDecl`
- `RelationEndpointAmbiguousAfterAliasing`
- `PersistenceModeConflict`
- `EquivalenceConflict`

Do not add more unless required.

---

## Acceptance Criteria

- [ ] Explicit composition lawbook contains real semantic rules
- [ ] Explicit composition executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All explicit composition tests pass
- [ ] No relaxation occurs without explicit declaration
- [ ] Persistence/equivalence strictness remains intact

---

## Non-Goals

- Do not add import syntax
- Do not add wildcard imports
- Do not add merge semantics
- Do not add override precedence
- Do not infer namespaces or aliases
- Do not weaken conservative composition defaults

---

## Failure Policy

If current module/workspace structures are insufficient for deterministic lifting or resolution:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-011-explicit-composition-semantic-population.questions.md
   ```
3. describe exact missing invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Conservative composition answers:

> when must composition fail?

Explicit composition answers:

> when may composition succeed safely despite nominal collisions?

This task adds expressive power without sacrificing determinism or identity discipline.

---

## Next Step

After completion:

- run explicit composition tests
- update blocking report
- then decide whether next semantic population target is:
  - deployment envelope
  - durable runtime journal
  - or kernel, if kernel is finally made concrete

---