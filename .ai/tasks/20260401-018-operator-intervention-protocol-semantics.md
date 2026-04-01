# Task 20260401-018: Operator Intervention Protocol Semantics

**Objective**: Define and implement a **minimal, explicit operator intervention protocol** so that human/operator actions become first-class, auditable, replay-safe runtime events rather than ad hoc side effects.

---

## Current State

After Task `20260401-017`:

- parser has a concrete subset
- canonical rendering is deterministic
- composition is explicit
- kernel is explicit and rebound downstream
- runtime integration exists
- durable runtime journal exists
- module/import surface syntax exists

However:

- operator actions are still only implicit or weakly represented
- there is no explicit admissibility model for intervention
- runtime history can record actions, but action semantics are not yet closed
- replay behavior for operator actions is not defined

So the system is:

> declarative, evaluative, and journaled, but not yet explicitly governable by bounded human intervention

This task fixes that.

---

## Architectural Decision

Operator intervention must be treated as:

> explicit protocol, not informal override

It must:

- define what actions are admissible
- define when they may be issued
- define whether they are replayable
- define whether they are reversible
- define how they affect runtime flow without mutating declarative source

It must not:

- rewrite policy source
- bypass kernel semantics
- silently alter journal meaning

---

## Constraint

Do **not** implement:

- authentication / authorization
- multi-operator concurrency control
- UI workflow
- remote command transport
- role-based access control
- approval chains

This task is only about:

> the semantic protocol of intervention itself

---

## Scope

Introduce a minimal operator action set:

```ts
type OperatorAction =
  | {
      tag: "RetryIntegration"
      workspaceId: string
    }
  | {
      tag: "AcknowledgeConflict"
      workspaceId: string
      conflictTag: string
    }
  | {
      tag: "RequestRebind"
      roleId: string
      targetProfile: "tmux" | "windows-terminal-wsl"
    }
  | {
      tag: "RecordNote"
      scope: "workspace" | "role"
      targetId: string
      note: string
    }
```

And an intervention verdict:

```ts
type OperatorActionVerdict = {
  admissible: boolean
  replayable: boolean
  reversible: boolean
  reason?: string
}
```

---

## Policy Decisions

### 1. Source non-mutation rule

No operator action may mutate:

- `/policy/src`
- `/policy/spec`
- kernel objects as source of truth

Operator actions affect only:

- runtime behavior
- journaled history
- operational evaluation flow

---

### 2. Closed action set

Only the explicitly declared action tags above are admissible in this task.

No generic:
- override
- force
- execute arbitrary command
- edit role

This keeps the protocol bounded.

---

### 3. Admissibility depends on current runtime context

Operator actions are not globally admissible.

They must be checked against current runtime state.

At minimum:

#### RetryIntegration
Admissible iff:
- target workspace exists

Replayable:
- yes

Reversible:
- no

#### AcknowledgeConflict
Admissible iff:
- target workspace exists
- named conflict currently exists in latest integration verdict

Replayable:
- yes

Reversible:
- yes (by removing the acknowledgment event in hypothetical history, not by mutating source)

#### RequestRebind
Admissible iff:
- target role exists
- target profile is known
- request does not mutate declarative role identity

Replayable:
- yes

Reversible:
- yes

#### RecordNote
Admissible iff:
- scope target exists
- note is non-empty

Replayable:
- yes

Reversible:
- yes

---

### 4. No semantic override rule

No operator action may by itself assert:

- role satisfied
- workspace satisfied
- conflict erased from semantic reality
- persistence preserved

For example:

- `AcknowledgeConflict` does **not** remove the underlying conflict from kernel/integration truth
- it only records operator acknowledgment

This is the main anti-cavity law.

---

### 5. Replay semantics

Replay of operator actions must preserve:

- order
- admissibility checks relative to replayed state
- audit meaning

Replay of an action that becomes inadmissible under changed replay state must fail explicitly.

It must not silently succeed.

---

### 6. Journal integration

Operator actions must be journalable as first-class runtime history.

They must not be hidden side effects.

So journal recordability must include operator actions as bounded payloads.

---

### 7. Reversibility is semantic, not implementation-specific

`reversible: true` means:

- the action’s operational effect is not logically irreversible
- a future explicit compensating action could negate it

It does **not** require implementing undo mechanics in this task.

---

### 8. Determinism

Given same runtime state and same operator action:

```text
state + action -> same verdict
```

No environment dependence.

---

## Deliverables

- [ ] Create operator intervention lawbook
- [ ] Create operator intervention executable spec
- [ ] Define `OperatorAction` and `OperatorActionVerdict`
- [ ] Implement admissibility function:
  ```ts
  evaluateOperatorAction(state, action): OperatorActionVerdict
  ```
- [ ] Integrate operator action recordability with journal semantics
- [ ] Replace operator-protocol `todo` tests with real tests

---

## Required Law Families

### Law family O1 — Closed action-set laws
- only declared action tags are admissible
- no generic override action exists

### Law family O2 — Admissibility laws
- each action has explicit admissibility preconditions

### Law family O3 — No semantic override laws
- operator actions do not mutate kernel truth or source policy

### Law family O4 — Replay laws
- operator actions replay in order
- inadmissible replay fails explicitly

### Law family O5 — Journal integration laws
- operator actions are journaled as first-class records

---

## Runtime State Input

At minimum, operator-action evaluation may assume:

```ts
type OperatorRuntimeState = {
  workspaces: string[]
  roles: string[]
  latestConflictsByWorkspace: Record<string, string[]>
}
```

Keep this minimal.

Do not introduce richer orchestration state unless required.

---

## Test Plan

Implement tests for:

1. **RetryIntegration admissible for existing workspace**
2. **RetryIntegration rejected for unknown workspace**
3. **AcknowledgeConflict admissible only for present conflict**
4. **AcknowledgeConflict does not erase semantic conflict truth**
5. **RequestRebind admissible for known role and known profile**
6. **RequestRebind rejected for unknown role**
7. **RecordNote rejected for empty note**
8. **all admitted actions are replayable as declared**
9. **replay fails when action becomes inadmissible under replayed state**
10. **operator actions are journalable as first-class records**

---

## Acceptance Criteria

- [ ] Operator intervention lawbook contains explicit semantic rules
- [ ] Executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All operator protocol tests pass
- [ ] Operator actions are deterministic and journalable
- [ ] No operator action can override declarative or kernel truth

---

## Non-Goals

- Do not implement permissions
- Do not implement UI flows
- Do not implement remote RPC
- Do not implement full undo/redo
- Do not implement operator identity/auth
- Do not implement arbitrary command execution

---

## Failure Policy

If current runtime/journal structures are insufficient to evaluate or replay operator actions cleanly:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-018-operator-intervention-protocol-semantics.questions.md
   ```
3. identify the exact missing state invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Themis currently has:

- declarative law
- runtime judgment
- durable history

But no bounded semantics for:

> what a human may do, and how that action enters lawful history

This task closes that gap.

---

## Next Step

After completion:

- rerun journal tests and integration tests
- update blocking report
- then choose whether next frontier is:
  - concrete backend realization
  - richer import resolution
  - or retention / compaction semantics for runtime history

---