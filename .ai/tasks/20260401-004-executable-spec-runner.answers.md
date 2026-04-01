# Answers for Task 20260401-002

## Q1: Executable Spec Content
**Answer: A**

Create placeholder `.spec.ts` files with `test.todo()` for each executable spec.

Do **not** invent full tests from lawbooks in this task.

Reason:
- current `.md` executable specs are not actually executable
- task scope is runner wiring, not semantic expansion
- `test.todo()` preserves truth: tests are recognized, implementations pending
- avoids fake-green behavior

Rule:
> represent missing executable substance honestly, without inventing semantics.

---

## Q2: Test Implementation Scope
**Answer: A**

Only create the runner infrastructure and wire discovery/execution.

Use placeholder `test.todo()` cases derived from each executable spec file title.

Do **not** implement full semantic tests yet.

Do **not** use always-pass documentation tests.

Reason:
- task explicitly says not to rewrite executable spec content
- full law-to-test derivation is a separate task
- infrastructure-first is the narrow, correct move

Rule:
> this task closes the execution boundary, not the semantic implementation gap.

---

## Q3: File Organization
**Answer: A**

Co-locate the `.spec.ts` files with the `.md` files in:

```text
/policy/spec/tests/
```

Reason:
- keeps one object family in one place
- preserves source/spec authority boundary
- simplest discovery model
- avoids splitting authoritative spec and executable harness across directories

Rule:
> keep executable harness adjacent to the spec source it operationalizes.

Suggested naming:

```text
parser-executable-spec.md
parser-executable-spec.spec.ts
```

---

## Q4: Test Granularity
**Answer: A**

Use one `describe(...)` block per executable spec file, with one or more `test.todo(...)` entries that mirror the major sections or declared checks in that file.

Do **not** derive from corresponding lawbooks in this task.

Do **not** reduce each file to one trivial parse test.

Reason:
- preserves file-level identity
- gives stable future insertion points for real tests
- keeps granularity honest without semantic invention

Rule:
> suite per executable spec file; todo cases per declared executable concern.

---

## Q5: Zero Tests = Failure
**Answer: B**

Create structural executable placeholders so the suite is non-empty, but do not fake semantic success.

That means:
- at least one discovered suite per executable spec file
- inside it, one or more `test.todo(...)`
- and one global guard test that fails if no executable spec wrappers are discovered

Do **not** let zero tests pass silently.  
Do **not** create implicit passing placeholders.

Reason:
- satisfies non-zero safety invariant
- keeps the suite honest
- avoids greenwashing the corpus

Rule:
> non-zero test inventory is required; semantic implementation may remain pending.

---

## Final operational summary

Implement:

1. Vitest setup
2. discovery of `/policy/spec/tests/*.md`
3. one adjacent `.spec.ts` wrapper per executable spec markdown
4. `describe(title, ...)` + `test.todo(...)` placeholders
5. one global guard ensuring at least one executable spec wrapper is present
6. `pnpm test` wired at repo root

Do **not**:

- derive full tests from lawbooks
- create always-pass documentation tests
- generate wrappers at runtime only
- move tests outside `/policy/spec/tests`

---

## Follow-on task

After this task completes, create a separate task:

> **20260401-003 executable-spec semantic implementation**

That later task can replace `todo` placeholders with actual law-enforcing tests.

