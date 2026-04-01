# Task 20260401-023: End-to-End Scenario Conformance

**Objective**: Define and implement a **minimal end-to-end conformance layer** that verifies the full Themis pipeline on bounded scenarios, from authored module/workspace source through parsing, lowering, composition, runtime integration, and journaling.

---

## Current State

After Task `20260401-022`:

- parser subset is concrete
- canonical rendering is deterministic
- kernel exists and downstream layers are rebound to it
- conservative and explicit composition exist
- runtime integration exists
- durable journal exists
- operator protocol and compensation exist
- concrete WT+WSL and tmux backend realizations exist
- cross-backend parity constraints exist

However:

- each layer is primarily tested in isolation
- there is no explicit whole-pipeline conformance object
- no machine-checkable proof exists that the layers remain aligned when composed in sequence

So the system is:

> locally verified, but not yet globally exercised through bounded scenarios

This task fixes that.

---

## Architectural Decision

Scenario conformance is **not** a new semantic layer.  
It is a **cross-layer validation object**.

It must:

- define bounded canonical scenarios
- run them through the whole stack
- assert expected outputs at each stage
- detect drift between individually-correct layers

The rule is:

> if the layers are truly aligned, a bounded scenario must remain lawful from source to journal without hidden reinterpretation

---

## Constraint

Do **not** expand language or runtime scope.

Do **not** add new semantics to make scenarios easier.

Do **not** test every combinatorial case.

This task is only about:

> a small set of representative scenarios that exercise the existing semantic spine end-to-end

---

## Scope

Define at least three canonical scenarios:

### Scenario A — Minimal Single Workspace Success
- one module / one workspace
- one role
- valid facts
- admissible integration
- journal append + replay success

### Scenario B — Conservative Composition Failure
- two modules
- role id or subject identity collision
- composition fails
- no runtime integration attempted

### Scenario C — Explicit Composition Success
- two modules
- same local role ids but explicit namespace policy
- optional shared subject identity with exact declaration
- successful composition
- valid runtime facts
- admissible integration
- journal append + replay success

Optional fourth scenario if stable:

### Scenario D — Operator Compensation
- conflict acknowledged
- later withdrawn by compensation action
- effective operator state changes
- history remains intact

---

## Pipeline Under Test

For each applicable scenario:

```text
source
→ parse
→ lower / kernel validity
→ render (canonical if needed)
→ compose (conservative or explicit)
→ runtime integration
→ journal append
→ journal replay
→ operator-state reconstruction (if scenario includes operator actions)
```

All transitions must use existing semantics only.

---

## Policy Decisions

### 1. Scenario inputs are authoritative fixtures

Scenario source files and expected outcomes must live under:

```text
/policy/spec/fixtures/scenarios/
```

They are source fixtures, not generated artifacts.

---

### 2. Bounded expected outputs

Each scenario must specify expected outputs for the stages it exercises.

At minimum, expectations may include:

- parse success/failure
- composition success/failure
- kernel well-formedness success/failure
- integration admissible/not admissible
- journal replay success/failure
- effective operator state (if used)

No open-ended assertions.

---

### 3. Determinism requirement

Running the same scenario twice must produce:

- same canonical render
- same composition verdict
- same integration verdict
- same journal replay result

No environment dependence.

---

### 4. No scenario-local semantic hacks

Scenario harness may orchestrate the pipeline,
but may not add ad hoc fixes or special-case logic.

If a scenario fails, fix the layer, not the harness.

---

### 5. Stage visibility

Conformance tests must expose stage boundaries clearly.

A failing scenario must report:
- which stage failed
- what the expected stage output was
- what was actually produced

No opaque “scenario failed” output.

---

## Deliverables

- [ ] Create end-to-end scenario conformance lawbook
- [ ] Create end-to-end scenario executable spec
- [ ] Add scenario fixtures under `/policy/spec/fixtures/scenarios/`
- [ ] Implement bounded scenario harness
- [ ] Replace conformance-layer `todo` tests with real tests
- [ ] Ensure deterministic full-pipeline execution

---

## Required Law Families

### Law family S1 — Stage alignment
- outputs of one stage are admissible inputs to the next
- no hidden reinterpretation between stages

### Law family S2 — Scenario determinism
- same scenario yields same results across runs

### Law family S3 — Failure locality
- failure is attributed to the exact pipeline stage

### Law family S4 — Fixture authority
- scenario fixtures are authoritative source fixtures

### Law family S5 — No harness semantics
- harness orchestrates only; it does not invent semantics

---

## Test Plan

Implement tests for:

1. **Scenario A parses, lowers, integrates, journals, and replays successfully**
2. **Scenario A canonical render is stable across reruns**
3. **Scenario B fails at conservative composition with expected conflict**
4. **Scenario B does not proceed to runtime integration**
5. **Scenario C succeeds under explicit namespace lifting**
6. **Scenario C integration is admissible with expected facts**
7. **Scenario C journal replay reproduces stored verdict**
8. **Scenario D compensation changes effective operator state but preserves history** *(if Scenario D included)*
9. **same scenario run twice yields identical stage outputs**
10. **conformance harness reports exact failing stage on negative scenario**

---

## Harness Shape

At minimum:

```ts
type ScenarioResult = {
  stageResults: Array<{
    stage: string
    ok: boolean
    details?: unknown
  }>
  ok: boolean
  failedStage?: string
}
```

And:

```ts
runScenario(name: string): ScenarioResult
```

No richer orchestration required in this task.

---

## Acceptance Criteria

- [ ] Conformance lawbook contains explicit rules
- [ ] Conformance executable spec contains real tests
- [ ] At least Scenarios A, B, and C are implemented
- [ ] All conformance tests pass
- [ ] Failure stage reporting is explicit
- [ ] No scenario harness introduces semantics not already defined elsewhere

---

## Non-Goals

- Do not add broad scenario combinatorics
- Do not test all backend/runtime variations
- Do not introduce stochastic or fuzz testing
- Do not broaden language subset
- Do not implement performance/load testing

---

## Failure Policy

If two already-populated layers cannot be composed cleanly in the scenario harness:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-023-end-to-end-scenario-conformance.questions.md
   ```
3. identify the exact stage boundary mismatch
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Themis now has many locally closed objects.

What is still missing is explicit proof that they form one lawful pipeline rather than a set of adjacent islands.

This task turns the stack into:

> a bounded, executable whole

---

## Next Step

After completion:

- rerun full test suite
- regenerate blocking report
- then choose whether next frontier is:
  - journal retention / compaction semantics
  - richer import resolution semantics
  - or corpus-level coverage and closure auditing

---