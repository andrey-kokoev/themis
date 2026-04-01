# Task 20260401-008: Parser Semantic Population

**Objective**: Replace the current parser lawbook/template shell with a **minimal, closed, operational parser semantics** that is concrete enough to support the first true semantic executable tests.

---

## Current State

The corpus currently has:

- parser-related lawbook/spec files
- runner wiring
- placeholder executable tests
- structural closure

But the parser object is still under-specified:

- grammar is mostly template-like
- parser contract is not operational enough
- acceptance/failure behavior is not fully fixed
- AST output shape is not concrete enough for semantic enforcement

So the parser layer is:

> structurally present, semantically thin

This task fixes that.

---

## Architectural Decision

The parser is the first semantic anchor.

It must be made concrete **before** broader semantic implementation proceeds.

This task must define:

- a tiny accepted grammar subset
- exact AST output shape
- exact rejection conditions
- deterministic parse behavior

The parser must become:

```text
input text -> AST | error
```

with no semantic cavities inside the defined subset.

---

## Constraint

Do **not** expand to the full language.

Do **not** chase generality.

Do **not** define substrate/runtime/module syntax here.

This task is only about:

> the smallest parser core that can be fully specified and tested

---

## Scope

Populate semantics only for the following tiny closed subset:

### Accepted top-level form

Exactly one workspace:

```text
workspace "<name>" {
  context {
    <key> "<value>"
    ...
  }

  persistence "<mode>"
  equivalence "<name>"

  role "<role-id>" {
    kind "<kind>"

    subject {
      identity "<subject-id>"
      reference "<reference>"
      locator "<locator>"     // optional
    }

    realizer "<class>" "<payload>"
    witness "<class>" <payload>
  }

  relation "<kind>" "<source>" "<target>"   // optional, repeatable
}
```

### Out of scope for this task

Do **not** semantically populate:

- extension blocks
- inline relation sugar
- witness sugar variants
- namespacing/imports
- multi-workspace composition syntax
- comments/trivia preservation
- recovery parsing

Those remain outside the first parser semantic core.

---

## Policy Decisions

### 1. Single root only

- exactly one workspace
- no trailing top-level forms
- no multiple roots

### 2. Deterministic parser

For any valid input in scope:

- parse result must be unique
- no ambiguity
- no heuristic reinterpretation

### 3. Concrete AST shape

Parser must emit a fixed AST for the subset.

At minimum:

- `Workspace`
- `ContextBlock`
- `PersistenceClause`
- `EquivalenceClause`
- `RoleBlock`
- `SubjectBlock`
- `RealizerBlock`
- `WitnessBlock`
- `RelationBlock`

### 4. Failure behavior

Parser must reject:

- missing required blocks/clauses
- malformed braces
- trailing root content
- wrong clause nesting
- wrong token shape in the populated subset

### 5. Ordering

Semantic acceptance does not depend on incidental source ordering **within the fixed grammar rules**, but canonical render order is separate and not part of this task.

Parser only needs to accept the defined syntactic order.

---

## Deliverables

- [ ] Populate parser lawbook with actual parser laws for the scoped subset
- [ ] Populate parser executable spec with actual semantic parser checks
- [ ] Define exact accepted AST shape for the subset
- [ ] Define exact parse error classes for the subset
- [ ] Replace parser `todo` placeholders with real tests
- [ ] Ensure `pnpm test` runs parser semantic tests successfully

---

## Required Semantic Content to Add

The parser lawbook must be updated to include, explicitly:

### Law family P1 — Root laws
- exactly one workspace root
- no trailing top-level content
- workspace header must be present

### Law family P2 — Block structure laws
- `context` may only appear at workspace level
- `subject` may only appear inside role
- `realizer` and `witness` may only appear inside role
- `relation` may only appear at workspace level

### Law family P3 — Required clause laws
For the scoped subset, a valid role requires:
- `kind`
- `subject.identity`
- `subject.reference`
- at least one `realizer`
- at least one `witness`

A valid workspace requires:
- `context`
- `persistence`
- `equivalence`
- at least one `role`

### Law family P4 — Determinism laws
- same input → same AST
- invalid input → same error class

### Law family P5 — Delimiter/EOF laws
- braces dominate structure
- EOF closure enforced
- missing block close is error
- extra trailing root content is error

---

## Required Error Classes

At minimum, define and use:

- `UnexpectedToken`
- `UnexpectedEOF`
- `MissingRequiredClause`
- `InvalidNesting`
- `TrailingRootContent`

Do not add more unless needed.

---

## AST Contract

Define parser output shape concretely enough to assert in tests.

At minimum:

```ts
type Workspace = {
  tag: "Workspace";
  name: string;
  items: WorkspaceItem[];
};

type WorkspaceItem =
  | ContextBlock
  | PersistenceClause
  | EquivalenceClause
  | RoleBlock
  | RelationBlock;
```

with corresponding nested block types for:
- subject
- realizer
- witness

This may reuse or refine existing AST files, but the contract must be explicit in the parser lawbook/spec.

---

## Test Plan

Implement real parser tests for:

1. **parses minimal valid workspace**
2. **rejects second root after complete workspace**
3. **rejects role-local clauses at workspace level**
4. **rejects subject block outside role**
5. **rejects missing role kind**
6. **rejects missing subject reference**
7. **rejects missing realizer**
8. **rejects missing witness**
9. **rejects missing closing brace**
10. **is deterministic for same valid input**

These are the first true semantic tests.

---

## Acceptance Criteria

- [ ] Parser lawbook contains explicit semantic parser laws
- [ ] Parser executable spec contains real parser tests, not placeholders
- [ ] At least the 10 parser tests above are implemented
- [ ] All parser tests pass
- [ ] Parser remains deterministic
- [ ] No semantics outside the scoped subset were invented

---

## Non-Goals

- Do not fully populate the whole language grammar
- Do not implement comments/trivia
- Do not implement recovery
- Do not implement import/module syntax
- Do not expand to runtime/substrate semantics
- Do not canonicalize formatting here

---

## Failure Policy

If an existing parser file structure prevents clean semantic population:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-008-parser-semantic-population.questions.md
   ```
3. explain exact blocking mismatch
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Themis currently has executable infrastructure but not executable law.

This task creates the first true semantic anchor by making the parser object concrete enough to test honestly.

After this task, the corpus should have:

> at least one object whose lawbook, executable spec, and tests all truly align

---

## Next Step

After completion:

- run parser tests
- update blocking report
- only then decide whether next semantic population target is:
  - kernel
  - rendering
  - conservative composition

---