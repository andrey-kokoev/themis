# Task 20260401-019: WT+WSL Concrete Backend Realization

**Objective**: Implement a **minimal, deterministic concrete backend realization** for the existing Windows Terminal + WSL profile and policy layers, so that declared terminal-session actions become actual backend commands and observations without introducing new semantics.

---

## Current State

After Task `20260401-018`:

- parser subset is concrete
- canonical rendering is deterministic
- composition is explicit
- kernel is explicit
- runtime integration exists
- journal exists
- operator intervention protocol exists
- WT+WSL profile semantics exist
- WT+WSL operational policy exists

However:

- WT+WSL remains a semantic/profile layer only
- no concrete backend command synthesis exists
- no deterministic realization of:
  - tab creation
  - tab reuse
  - WSL command execution
  - bounded observation capture

So the system is:

> semantically profile-aware, but not yet concretely executable in the WT+WSL substrate

This task fixes that.

---

## Architectural Decision

Concrete backend realization is an **implementation-constraining** task, not a semantic-broadening task.

It must:

- consume the already-existing WT+WSL action profile
- consume the already-existing WT+WSL operational decision
- emit a deterministic backend execution plan
- emit bounded observation requests
- preserve the already-fixed non-semanticity of:
  - tab identity
  - pane identity
  - profile name
  - distro name

The rule is:

> backend realization may operationalize existing semantics, but may not add new ones

---

## Constraint

Do **not** implement:

- dynamic discovery heuristics
- fuzzy tab matching
- UI automation
- shell quoting generality beyond minimal closed rules
- pane split geometry
- profile GUID lookup from external state
- path inference from workspace references
- terminal restore/session resurrection

This task is only about:

> deterministic command-plan generation for the existing WT+WSL profile/policy model

---

## Scope

Input:

```ts
type WindowsTerminalWslActionProfile
type WtWslOperationalDecision
```

Output:

```ts
type WtWslBackendPlan = {
  steps: BackendStep[]
  observationPlan: ObservationRequest[]
}
```

Minimal step set:

```ts
type BackendStep =
  | {
      tag: "LaunchTab"
      tabBinding: string
      profileName?: string
      distroName?: string
      command?: string
    }
  | {
      tag: "ReuseTab"
      tabBinding: string
    }
  | {
      tag: "InvokeWslCommand"
      distroName?: string
      command: string
    }
  | {
      tag: "AttachTarget"
      tabBinding: string
      target: string
    }
  | {
      tag: "TailSource"
      tabBinding: string
      source: string
    }
```

Observation request set:

```ts
type ObservationRequest =
  | {
      tag: "CaptureTabState"
      tabBinding: string
    }
  | {
      tag: "CaptureProfile"
      tabBinding: string
    }
  | {
      tag: "CaptureDistro"
      tabBinding: string
    }
  | {
      tag: "CaptureCommandResult"
      tabBinding: string
    }
```

No more than this in v0.

---

## Policy Decisions

### 1. Backend realization is driven by policy output

Concrete backend code must **not** decide:

- whether to reuse or create a tab
- whether a profile/distro should be selected
- whether pane reuse is allowed

Those are already decided in:

- `formWindowsTerminalWslActionProfile(...)`
- `decideWtWslRouting(...)`

Backend realization only consumes those results.

---

### 2. Command-plan determinism

Given the same:

- WT+WSL action profile
- WT+WSL routing decision

backend realization must emit the same `WtWslBackendPlan`.

No environment-dependent branching.

---

### 3. Create vs reuse

If:

```ts
decision.tabDecision === "create-new-tab"
```

emit:

- `LaunchTab`
- plus command-bearing step if needed

If:

```ts
decision.tabDecision === "reuse-existing-tab"
```

emit:

- `ReuseTab`
- plus command-bearing step if needed

No heuristic override.

---

### 4. Action-class mapping

#### command
Maps to:
- tab create/reuse
- then `InvokeWslCommand`

#### attach
Maps to:
- tab create/reuse
- then `AttachTarget`

#### tail
Maps to:
- tab create/reuse
- then `TailSource`

No class drift allowed.

---

### 5. WSL command isolation

Only `command` actions may emit `InvokeWslCommand`.

Neither:
- `attach`
- nor `tail`

may be rewritten into generic shell commands in this task.

This preserves class stability.

---

### 6. Profile and distro selectors are explicit-only

If `selectedProfileName` or `selectedDistroName` is absent in routing decision:

- backend must leave them absent
- backend must not fill defaults

No hidden selector inference.

---

### 7. Observation boundary remains bounded

Backend realization may request only the observation classes already admitted by WT+WSL profile/policy semantics.

In v0, backend observation plan may include only:

- tab state
- profile
- distro
- command result

No:
- focused tab
- title
- color scheme
- split ratio
- active pane heuristics

---

### 8. No direct semantic judgment

Backend plan generation must not emit:

- role satisfied
- workspace satisfied
- persistence verdicts
- conflict acknowledgment

It is purely operational.

---

## Deliverables

- [ ] Create WT+WSL concrete backend realization lawbook
- [ ] Create WT+WSL backend executable spec
- [ ] Implement backend-plan generation:
  ```ts
  realizeWtWslBackend(profile, decision): WtWslBackendPlan
  ```
- [ ] Replace WT+WSL backend `todo` tests with real tests
- [ ] Keep behavior deterministic and semantics-preserving

---

## Required Law Families

### Law family W1 — Policy consumption laws
- backend realization consumes existing profile/policy outputs
- backend does not re-decide routing

### Law family W2 — Action mapping laws
- command → InvokeWslCommand
- attach → AttachTarget
- tail → TailSource

### Law family W3 — Selector explicitness laws
- profile/distro remain absent unless explicitly selected upstream

### Law family W4 — Observation boundary laws
- backend observation requests remain within admitted profile boundary

### Law family W5 — Non-judgment laws
- backend emits operational plan only, never semantic verdicts

---

## Test Plan

Implement tests for:

1. **create-new-tab command emits LaunchTab + InvokeWslCommand**
2. **reuse-existing-tab command emits ReuseTab + InvokeWslCommand**
3. **attach emits AttachTarget and not InvokeWslCommand**
4. **tail emits TailSource and not InvokeWslCommand**
5. **absent profile/distro remain absent in backend plan**
6. **explicit profile/distro are propagated unchanged**
7. **backend does not alter tabDecision semantics**
8. **observation plan stays within admitted request set**
9. **same input yields same backend plan**
10. **backend plan contains no semantic verdict fields**

---

## Acceptance Criteria

- [ ] WT+WSL backend lawbook contains explicit realization rules
- [ ] WT+WSL backend executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All backend realization tests pass
- [ ] Backend realization is deterministic
- [ ] No new semantics are introduced

---

## Non-Goals

- Do not execute real `wt.exe`
- Do not execute real `wsl.exe`
- Do not implement shell escaping in full generality
- Do not implement tab discovery
- Do not implement pane geometry
- Do not implement restore/reconnect semantics

---

## Failure Policy

If the current WT+WSL profile or policy outputs are insufficient to synthesize a stable backend plan:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-019-wt-wsl-concrete-backend-realization.questions.md
   ```
3. describe the exact missing invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

You already defined:

- WT+WSL semantics
- WT+WSL routing policy

But until there is a concrete backend plan, those layers stop short of execution.

This task closes that gap while keeping the already-fixed semantic boundaries intact.

---

## Next Step

After completion:

- rerun WT+WSL profile/policy tests
- add backend realization tests to the runner
- then choose whether next frontier is:
  - tmux concrete backend realization
  - journal retention/compaction semantics
  - or operator action replay compensation semantics

---