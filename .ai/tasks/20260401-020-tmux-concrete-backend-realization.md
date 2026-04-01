# Task 20260401-020: Tmux Concrete Backend Realization

**Objective**: Implement a **minimal, deterministic concrete backend realization** for the existing tmux profile semantics, so that terminal-session actions can be lowered into explicit tmux backend plans without introducing new semantics.

---

## Current State

After Task `20260401-019`:

- WT+WSL now has a concrete backend realization path
- parser, rendering, composition, kernel, runtime integration, journal, envelope, and operator protocol all have explicit semantic direction
- tmux profile semantics already exist as a concrete profile layer

However:

- tmux still remains only a semantic/profile object
- there is no explicit backend-plan generation for tmux
- command / attach / tail do not yet lower into deterministic tmux operation plans

So the system is:

> concretely executable for WT+WSL, but still only semantically profiled for tmux

This task fixes that.

---

## Architectural Decision

Tmux backend realization is an **operationalization** of the already-defined:

- terminal-session semantics
- tmux profile semantics

It must:

- consume `TmuxActionProfile`
- emit a deterministic `TmuxBackendPlan`
- preserve all already-fixed non-semanticity constraints on:
  - session name
  - window name
  - pane selector
  - layout

The rule is:

> tmux backend realization may operationalize tmux profile semantics, but may not broaden them

---

## Constraint

Do **not** implement:

- actual tmux CLI execution
- quoting generality beyond minimal closed rules
- pane geometry
- window naming heuristics
- session discovery heuristics
- resurrect plugin semantics
- startup race handling
- shell process supervision

This task is only about:

> deterministic backend-plan generation for tmux from already-fixed profile semantics

---

## Scope

Input:

```ts
type TmuxActionProfile
```

Output:

```ts
type TmuxBackendPlan = {
  steps: TmuxBackendStep[]
  observationPlan: TmuxObservationRequest[]
}
```

Minimal step set:

```ts
type TmuxBackendStep =
  | {
      tag: "EnsureSession"
      sessionName: string
    }
  | {
      tag: "ReuseSession"
      sessionName: string
    }
  | {
      tag: "RunCommand"
      sessionName: string
      windowName?: string
      paneSelector?: string
      command: string
    }
  | {
      tag: "AttachTarget"
      sessionName: string
      windowName?: string
      paneSelector?: string
      target: string
    }
  | {
      tag: "TailSource"
      sessionName: string
      windowName?: string
      paneSelector?: string
      source: string
    }
```

Observation request set:

```ts
type TmuxObservationRequest =
  | {
      tag: "CaptureSessionState"
      sessionName: string
    }
  | {
      tag: "CaptureWindow"
      sessionName: string
      windowName?: string
    }
  | {
      tag: "CapturePane"
      sessionName: string
      paneSelector?: string
    }
  | {
      tag: "CaptureCommandResult"
      sessionName: string
    }
```

No more than this in v0.

---

## Policy Decisions

### 1. Backend realization consumes profile output only

Tmux backend realization must not re-decide:

- whether the action class is valid
- whether session naming is acceptable
- whether window/pane targeting should exist

Those are already fixed upstream.

Backend realization only consumes `TmuxActionProfile`.

---

### 2. Session existence handling is explicit in plan, not heuristic in code

Need one explicit rule for v0.

If the plan targets a session name, backend realization must emit exactly one of:

- `EnsureSession`
- or `ReuseSession`

For v0, the least arbitrary rule is:

- default to `EnsureSession` for `command`
- default to `ReuseSession` for `attach`
- default to `EnsureSession` for `tail`

Reason:
- `attach` is semantically binding to an existing target
- `command` and `tail` may legitimately create an execution locus

This is operational only, not semantic continuity.

---

### 3. Action-class mapping

#### command
Maps to:
- `EnsureSession`
- then `RunCommand`

#### attach
Maps to:
- `ReuseSession`
- then `AttachTarget`

#### tail
Maps to:
- `EnsureSession`
- then `TailSource`

No class drift allowed.

---

### 4. Window/pane selectors propagate only if explicit

If `windowName` or `paneSelector` is absent in the input profile:

- backend plan must leave them absent
- backend must not invent defaults

No hidden layout decisions.

---

### 5. Observation boundary remains bounded

Tmux backend realization may request only:

- session state
- window
- pane
- command result

No:
- split ratios
- active pane
- zoom state
- color/status line
- layout string

---

### 6. Non-judgment rule

Tmux backend plan generation must not emit:

- role satisfied
- workspace satisfied
- persistence verdict
- conflict status

It is purely operational.

---

### 7. Determinism

Given same `TmuxActionProfile`:

```text
profile -> same TmuxBackendPlan
```

No environment-dependent branching.

---

## Deliverables

- [ ] Create tmux concrete backend realization lawbook
- [ ] Create tmux backend executable spec
- [ ] Implement backend-plan generation:
  ```ts
  realizeTmuxBackend(profile): TmuxBackendPlan
  ```
- [ ] Replace tmux backend `todo` tests with real tests
- [ ] Keep behavior deterministic and semantics-preserving

---

## Required Law Families

### Law family T1 — Profile consumption laws
- backend realization consumes profile output only
- backend does not re-decide semantics

### Law family T2 — Action mapping laws
- command → EnsureSession + RunCommand
- attach → ReuseSession + AttachTarget
- tail → EnsureSession + TailSource

### Law family T3 — Selector explicitness laws
- window/pane remain absent unless explicitly supplied

### Law family T4 — Observation boundary laws
- backend observation requests remain within admitted tmux profile boundary

### Law family T5 — Non-judgment laws
- backend emits operational plan only, never semantic verdicts

---

## Test Plan

Implement tests for:

1. **command emits EnsureSession + RunCommand**
2. **attach emits ReuseSession + AttachTarget**
3. **tail emits EnsureSession + TailSource**
4. **attach does not emit RunCommand**
5. **absent window and pane remain absent in backend plan**
6. **explicit window and pane are propagated unchanged**
7. **same profile yields same backend plan**
8. **observation plan stays within admitted request set**
9. **backend plan contains no semantic verdict fields**
10. **session handling rule follows command/tail ensure, attach reuse**

---

## Acceptance Criteria

- [ ] Tmux backend lawbook contains explicit realization rules
- [ ] Tmux backend executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All tmux backend realization tests pass
- [ ] Backend realization is deterministic
- [ ] No new semantics are introduced

---

## Non-Goals

- Do not execute real tmux commands
- Do not implement session discovery
- Do not implement pane layout control
- Do not implement shell escaping in full generality
- Do not implement attach conflict resolution
- Do not implement resurrect/restore behavior

---

## Failure Policy

If current tmux profile outputs are insufficient to synthesize a stable backend plan:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-020-tmux-concrete-backend-realization.questions.md
   ```
3. describe the exact missing invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

You already defined tmux as a thin concrete profile of terminal-session semantics.

But until there is a backend plan, tmux remains descriptive rather than concretely executable.

This task closes that gap while preserving all non-semanticity constraints already established.

---

## Next Step

After completion:

- rerun tmux profile tests
- add backend realization tests to the runner
- then choose whether next frontier is:
  - journal retention / compaction semantics
  - operator action replay compensation
  - or cross-backend execution parity constraints

---