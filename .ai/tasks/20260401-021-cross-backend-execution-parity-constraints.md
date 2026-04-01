# Task 20260401-021: Cross-Backend Execution Parity Constraints

**Objective**: Define and implement a **minimal, explicit parity layer** between the WT+WSL concrete backend realization and the tmux concrete backend realization so that the same terminal-session action class yields backend plans that are operationally different but semantically aligned.

---

## Current State

After Tasks `20260401-019` and `20260401-020`:

- WT+WSL has a concrete backend realization
- tmux has a concrete backend realization
- both consume already-fixed profile/policy semantics
- both preserve non-semanticity of backend-specific selectors

However:

- there is no explicit cross-backend parity contract
- no machine-checkable statement says that the two backends remain aligned at the semantic boundary
- backend plans could drift independently while still passing local tests

So the system is:

> concretely executable in two terminal-session backends, but not yet explicitly constrained to remain semantically parallel

This task fixes that.

---

## Architectural Decision

Parity is **not sameness of commands**.

Parity means:

- same action class
- same upstream profile/policy meaning
- same backend-plan intent class
- same observation boundary class
- same absence/presence rules for explicit selectors

The rule is:

> different concrete backends may operationalize differently, but they must preserve the same semantic envelope

This task defines and checks that envelope.

---

## Constraint

Do **not** implement:

- actual cross-backend migration
- shared execution engine
- command normalization across shells
- backend-agnostic runtime discovery
- UI parity
- performance parity

This task is only about:

> semantic parity constraints on backend-plan generation

---

## Scope

Inputs:

- `TerminalSessionActionSpec`
- `TmuxActionProfile`
- `WindowsTerminalWslActionProfile`
- their corresponding backend plans

Outputs:

```ts
type BackendParityVerdict = {
  aligned: boolean
  violations: BackendParityViolation[]
}
```

Minimal violation set:

```ts
type BackendParityViolation =
  | { tag: "ActionClassMismatch" }
  | { tag: "SelectorExplicitnessMismatch"; selector: "profile" | "distro" | "window" | "pane" | "session" | "tab" }
  | { tag: "IntentStepMismatch"; expectedIntent: "command" | "attach" | "tail" }
  | { tag: "ObservationBoundaryMismatch" }
  | { tag: "SemanticFieldLeak" }
```

---

## Policy Decisions

### 1. Action-class parity

For the same terminal-session action class:

- WT+WSL backend plan and tmux backend plan must express the same **intent class**

Mapping:

- `command` ↔ command-intent plan
- `attach` ↔ attach-intent plan
- `tail` ↔ tail-intent plan

Backends may use different step names, but not different intent.

---

### 2. No class drift

If a terminal-session `attach` becomes:

- `AttachTarget` in tmux
- but `InvokeWslCommand` in WT+WSL

that is a parity violation.

Likewise for `tail`.

This task must explicitly catch such drift.

---

### 3. Selector explicitness parity

Selectors that are optional upstream must remain optional downstream.

Parity rules:

- if upstream omitted pane/window/profile/distro selectors, neither backend may invent corresponding selectors
- if upstream explicitly provided them, the relevant backend may propagate only the selectors meaningful to it

This means parity is **not identical field presence**, but identical **explicitness discipline**.

Examples:

- WT+WSL may use `profileName`/`distroName`
- tmux may use `windowName`/`paneSelector`

But neither may invent them when upstream did not.

---

### 4. Observation boundary parity

Both backends must stay within the same observation category envelope:

- location/container state
- backend selector state
- command result

They may differ in concrete field names, but must not diverge in observation scope.

For v0, parity means:
- neither backend may request UI/layout metadata outside the admitted profile boundary

---

### 5. Semantic field leak prohibition

Neither backend plan may contain semantic verdict fields such as:

- satisfied
- admissible
- preserved
- conflictResolved

If one backend starts emitting semantic judgments inside the backend plan, parity fails.

---

### 6. Deterministic parity check

Given the same semantic input pair, parity checking must be deterministic.

No backend-specific heuristics.

---

## Deliverables

- [ ] Create cross-backend parity lawbook
- [ ] Create cross-backend parity executable spec
- [ ] Implement parity checker:
  ```ts
  checkBackendParity(input): BackendParityVerdict
  ```
- [ ] Replace parity-layer `todo` tests with real tests
- [ ] Ensure drift between backends becomes detectable

---

## Required Law Families

### Law family P1 — Intent parity
- command/attach/tail map to aligned backend intent classes

### Law family P2 — No class drift
- no backend rewrites one semantic class into another

### Law family P3 — Selector explicitness parity
- optional selectors remain explicit-only in both backends

### Law family P4 — Observation parity
- backend observation scope remains aligned

### Law family P5 — Non-semantic backend plans
- no backend may leak semantic verdicts into its operational plan

---

## Test Plan

Implement tests for:

1. **command plans across WT+WSL and tmux satisfy intent parity**
2. **attach plans across WT+WSL and tmux satisfy intent parity**
3. **tail plans across WT+WSL and tmux satisfy intent parity**
4. **class drift is detected if attach becomes command-like in one backend**
5. **omitted selectors remain omitted in parity-relevant sense**
6. **explicit selectors propagate without invented defaults**
7. **observation boundary mismatch is detected**
8. **semantic field leak is detected in backend plan**
9. **same semantic input yields same parity verdict**
10. **valid backend pair yields aligned=true with no violations**

---

## Acceptance Criteria

- [ ] Cross-backend parity lawbook contains explicit rules
- [ ] Cross-backend parity executable spec contains real tests
- [ ] All 10 parity tests above are implemented
- [ ] All parity tests pass
- [ ] Intent drift between backends is detectable
- [ ] No parity rule broadens backend semantics beyond existing profile layers

---

## Non-Goals

- Do not implement backend unification
- Do not implement shared quoting/execution engine
- Do not implement runtime migration between backends
- Do not enforce identical step shapes
- Do not compare performance or UX

---

## Failure Policy

If current backend-plan structures are insufficient to infer semantic intent classes cleanly:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-021-cross-backend-execution-parity-constraints.questions.md
   ```
3. identify the exact missing invariant in one or both backend plans
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

You now have two concrete backends.

Without an explicit parity layer, they can silently drift and become two different systems wearing one semantic name.

This task keeps them inside one terminal-session semantic envelope.

---

## Next Step

After completion:

- rerun WT+WSL and tmux backend tests
- add parity tests to the runner
- then choose whether the next frontier is:
  - operator action replay compensation
  - journal retention / compaction semantics
  - or richer import resolution semantics

---