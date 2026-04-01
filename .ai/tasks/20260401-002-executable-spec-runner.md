--- .ai/tasks/20260401-002-executable-spec-runner.md ---
# Task 20260401-002: Executable Spec Runner Wiring

**Objective**: Make all executable specs under `/policy/spec/tests` runnable as a deterministic test suite, ensuring that the PDA corpus is machine-checkable end-to-end.

---

## Current State

The repository has been successfully bootstrapped:

- Lawbooks exist under `/policy/spec/laws`
- Executable specs exist under `/policy/spec/tests`
- Notes (INDEX, CLOSURE, GRAPH) are present
- Structure is validated and idempotent

However:

- Executable specs are not wired into a test runner
- There is no single command that evaluates corpus correctness
- Spec failures cannot be detected automatically
- The corpus is **static**, not yet **executable law**

---

## Architectural Decision

Executable specs are the **runtime of the law corpus**.

They must:

- run deterministically
- fail loudly on violation
- require zero manual orchestration
- map directly to lawbook semantics

This task must:

> convert the PDA corpus from static markdown into an executable validation system

---

## Constraint

Do not introduce abstraction or reinterpretation.

Specifically:

- Do not rewrite executable spec content
- Do not reinterpret test semantics
- Do not merge or split spec files
- Do not introduce test heuristics

Only:

> provide execution harness and wiring

---

## Policy Decisions

### 1. Execution model

- Each executable spec file is a **test module**
- Each defined test case must be executed
- Failures must throw and stop execution

---

### 2. Runner

- Use **Vitest** (preferred) or Node-native runner if simpler
- One command:

```bash
pnpm test
```

must run all specs

---

### 3. Discovery

- All files under:

```text
/policy/spec/tests/
```

are test sources

- No manual registration

---

### 4. Determinism

- No randomness
- No time-based behavior
- No environment dependence

---

### 5. Output

- Pass/fail per test
- Clear error messages
- No noisy logging

---

## Deliverables

- [ ] Install test runner (Vitest or minimal Node harness)
- [ ] Create test bootstrap file:
  - loads all `/policy/spec/tests/*.md` or `.ts` specs
- [ ] Implement extraction of executable tests from spec files
- [ ] Execute all test cases in deterministic order
- [ ] Ensure failures halt execution with clear signal
- [ ] Add `pnpm test` script to root `package.json`
- [ ] Ensure zero tests = failure (safety check)

---

## Implementation Notes

### Option A (preferred)

Convert executable specs to `.ts` modules:

```text
/policy/spec/tests/*.spec.ts
```

Each exports:

```ts
export const tests = [...]
```

Runner imports and executes.

---

### Option B (fallback)

Keep `.md` and parse embedded code blocks.

Only if necessary.

---

### Execution order

- alphabetical by filename
- then in-file order

Must be stable.

---

## Validation

After implementation:

```bash
pnpm test
```

must:

- run all specs
- pass with current corpus
- fail on any intentional break

---

## Acceptance Criteria

- [ ] `pnpm test` executes all executable specs
- [ ] All current specs pass
- [ ] Introducing a failing condition causes test failure
- [ ] Execution is deterministic and repeatable
- [ ] No manual wiring required for new spec files

---

## Non-Goals

- Do not add new lawbooks
- Do not modify spec semantics
- Do not optimize performance
- Do not introduce coverage tooling yet

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

The corpus is currently:

> structurally valid but operationally inert

This task upgrades it to:

> executable law with enforceable invariants

---

## Next Step

After completion:

→ run the suite  
→ fix first failing test (if any)  
→ only then consider next PDA object

---