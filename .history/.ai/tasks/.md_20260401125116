# Task 20260401-009: Canonical Rendering Semantic Population

**Objective**: Define and implement a **minimal, closed, deterministic canonical rendering semantics** for the same parser subset introduced in Task 20260401-008, enabling the first end-to-end round-trip invariant:

```text
source → AST → canonical(source) → AST (equal)
```

---

## Current State

After Task 20260401-008:

- parser has a **concrete semantic subset**
- parser tests exist and pass
- AST shape is fixed for the subset

However:

- rendering is still unspecified or template-level
- no canonical form exists
- no normalization invariant is enforced

So the system is:

> parseable, but not yet canonically representable

---

## Architectural Decision

Canonical rendering is the **first normalization layer**.

It must:

- remove incidental variability
- preserve semantics
- be deterministic
- be idempotent

This task defines:

> a single canonical textual representation for any valid AST in the parser subset

---

## Constraint

Do **not** expand beyond the parser subset.

Do **not** introduce formatting preferences beyond necessity.

Do **not** implement pretty-printing modes.

This task defines:

> one canonical form only

---

## Scope

Applies only to AST produced by Task 20260401-008 subset.

Out of scope:

- comments
- whitespace preservation
- extension blocks
- imports / modules
- formatting configuration
- multi-workspace composition

---

## Policy Decisions

### 1. Canonical form uniqueness

For any valid AST:

```text
render(ast) → string
```

must be:

- unique
- stable
- independent of original input formatting

---

### 2. Idempotence

```text
render(parse(render(parse(x)))) == render(parse(x))
```

This is mandatory.

---

### 3. Ordering rules

Canonical output must enforce strict ordering:

#### Workspace level

1. `workspace "<name>" {`
2. `context { ... }`
3. `persistence "<mode>"`
4. `equivalence "<name>"`
5. `role` blocks (sorted by role id)
6. `relation` blocks (sorted lexicographically by (kind, source, target))
7. closing brace

---

### 4. Context ordering

Inside `context`:

- entries sorted by key (lexicographically)
- one per line

---

### 5. Role ordering

Roles sorted by:

```text
role.id (string ascending)
```

---

### 6. Inside role

Canonical order:

1. `kind`
2. `subject`
3. `realizer` (in source order, no reordering)
4. `witness` (in source order, no reordering)

---

### 7. Subject block

Canonical order:

1. `identity`
2. `reference`
3. `locator` (if present)

---

### 8. Relation ordering

Sorted lexicographically by tuple:

```text
(kind, source, target)
```

---

### 9. Formatting rules

Strict formatting:

- 2-space indentation
- no trailing spaces
- one item per line where applicable
- blank line between major blocks:
  - context
  - persistence/equivalence group
  - roles
  - relations

---

### 10. String normalization

- preserve exact string contents
- no escaping changes beyond required quoting
- no trimming inside quotes

---

## Deliverables

- [ ] Populate rendering lawbook with explicit canonical rendering laws
- [ ] Populate rendering executable spec with real tests
- [ ] Implement `render(ast)` for the subset
- [ ] Replace rendering `todo` tests with real tests
- [ ] Ensure round-trip invariants pass

---

## Required Law Families

### Law family R1 — Uniqueness
- each AST has exactly one canonical rendering

### Law family R2 — Idempotence
- canonical(render(canonical(x))) == canonical(x)

### Law family R3 — Ordering
- workspace, context, roles, relations follow fixed order

### Law family R4 — Stability
- same AST always yields same string

### Law family R5 — Losslessness (within subset)
- parsing canonical output reproduces equivalent AST

---

## Test Plan

Implement tests for:

1. **canonicalizes unordered roles**
2. **canonicalizes unordered context entries**
3. **canonicalizes relation ordering**
4. **preserves realizer/witness order**
5. **round-trip: parse → render → parse equality**
6. **idempotence of render**
7. **rejects non-subset AST (if encountered)**
8. **deterministic output for same AST**
9. **correct indentation and block layout**
10. **no trailing or extra whitespace**

---

## AST Equality

Define equality as:

- same structure
- same values
- order significant where defined (realizer/witness)
- order normalized where canonicalized (roles, relations, context)

---

## Acceptance Criteria

- [ ] Rendering lawbook contains explicit rules above
- [ ] Rendering executable spec has real tests (no todos for this object)
- [ ] `render(ast)` implemented for subset
- [ ] All rendering tests pass
- [ ] Round-trip invariant holds
- [ ] No formatting ambiguity remains

---

## Non-Goals

- Do not support multiple formatting styles
- Do not preserve original whitespace/comments
- Do not implement diff-friendly rendering modes
- Do not expand grammar beyond parser subset
- Do not handle partial ASTs

---

## Failure Policy

If AST structure from parser is insufficient for deterministic rendering:

1. do not patch rendering ad hoc
2. create:
   ```text
   .ai/tasks/20260401-009-canonical-rendering-semantic-population.questions.md
   ```
3. describe missing AST invariants
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Parser gives you:

> syntactic acceptance

Canonical rendering gives you:

> semantic normalization

Together they form the first **closed loop invariant** in Themis.

---

## Next Step

After completion:

- confirm round-trip invariant
- update blocking report
- proceed to:
  - conservative composition (if stable)
  - or kernel (if introduced)

---