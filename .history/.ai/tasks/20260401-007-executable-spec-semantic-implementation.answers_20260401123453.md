--- .ai/tasks/20260401-006-executable-spec-semantic-implementation.answers.md ---
# Answers for Task 20260401-005: Executable Spec Semantic Implementation

## High-level correction

Your diagnosis is correct.

Task `20260401-005` as written overreached the actual corpus state.

The current corpus is **structurally closed enough for scaffolding and runner wiring**, but **not semantically populated enough** for broad executable semantic implementation across the named objects.

So the right move is **not** to invent semantics and **not** to fake semantic tests.

---

## Blocking Issue 1: Lawbooks Are Skeletal Templates Without Semantic Content
**Answer: A**

Stop semantic implementation of those lawbooks.

Do **not** infer missing rules from titles or generic section structure.  
Do **not** replace semantic tests with fake “always-pass documentation tests.”

Structural tests are allowed only if they are explicitly re-scoped as **structural corpus integrity tests**, not semantic law tests.

### Rule
> If a lawbook does not contain operationalizable semantic rules, it cannot support semantic executable tests.

### Required action
Reclassify the blocked files as:

- **template lawbooks**
- **not yet semantically executable**

and do not implement semantic tests for them in Task 005.

---

## Blocking Issue 2: Missing "Kernel" Object
**Answer: D**

Stop and request kernel be added first **if semantic implementation truly depends on it**.

Do **not** create kernel files in this task.  
Do **not** reinterpret unrelated files as kernel.

However, there is an important refinement:

### Refinement
Task 005 should be **narrowed** to only those executable spec files that already contain enough explicit semantics to operationalize.

So:

- if no explicit kernel lawbook/spec exists → skip kernel
- do not block the entire task if some later executable specs are concrete enough
- only block the **kernel portion**

### Rule
> Missing objects are skipped, not invented.

---

## Blocking Issue 3: Filename Mismatch Between Task and Corpus
**Answer: B**

Work with the **existing numbered filenames**.

Do **not** create new files just to match the task prose.  
Do **not** rename existing files.

The task’s filenames are conceptual labels, not authoritative filesystem truth.

### Rule
> Filesystem truth beats task prose naming.

So implementation/reporting should map conceptually:

- “parser” → existing parser-related numbered spec files
- “runtime integration” → existing runtime-integration-related numbered spec files

Use actual filenames in all work and reports.

---

## Blocking Issue 4: What "Real Tests" Can Be Implemented
**Answer:**

A valid “real test” is only one that can be derived from **explicit semantic claims already present in the file being operationalized**.

Given the current corpus state, that means there are only three allowed categories:

### Category 1 — True semantic tests
Allowed only when the corresponding executable spec already states:
- concrete invariants
- concrete input/output behavior
- concrete acceptance condition

If such content exists, implement those tests.

### Category 2 — Structural integrity tests
Allowed only when explicitly framed as:
- corpus consistency
- file/metadata/reference validity
- cross-reference integrity
- ordering/inventory checks

These are **not semantic law tests**.  
They are structural corpus tests.

### Category 3 — Deferred placeholders
If neither semantic nor structural executable claims are present:
- keep `test.todo()`
- report blocked status
- do not invent

### Rule
> “Real” means derivable from explicit content, not from implied intention.

---

## Final decision for Task 005

Task `20260401-005` must be **rescoped**, not executed as originally written.

### New effective scope
Implement only:

1. **structural executable tests** for corpus integrity
2. **semantic tests** for the subset of spec files that already contain concrete operationalizable rules
3. leave all other files as `todo`
4. produce a blocking report for semantically under-specified lawbooks/specs

### Do not:
- invent kernel
- rename files
- infer semantics from titles
- convert documentation into fake green tests

---

## Operational instructions

### 1. Use actual filenames
Use the numbered existing files as canonical.

### 2. Partition spec files into three buckets

#### Bucket A — executable now
Files whose executable specs contain concrete testable behavior.

#### Bucket B — structural only
Files that can only support:
- front matter checks
- cross-reference checks
- file/classification/order checks

#### Bucket C — blocked
Files whose content is only template/prose without operationalizable rules.

### 3. For Bucket C
Keep `todo` placeholders and add to blocking report.

### 4. Produce a report file
Create:

```text
.ai/tasks/20260401-006-executable-spec-semantic-implementation.blocking-report.md
```

with table:

| file | classification | reason | action |
|---|---|---|---|
| ... | executable now / structural only / blocked | ... | implement / structural / todo |

---

## Re-scope statement to apply

Treat Task 005 as:

> “Implement semantic executable tests only where explicit executable semantics exist; otherwise preserve placeholders and report the semantic gap.”

That is the faithful, non-inventive interpretation.

---

## Summary answers

### Blocking Issue 1
**A** — stop semantic implementation for skeletal lawbooks.

### Blocking Issue 2
**D**, with refinement — skip kernel unless/ until explicit kernel artifacts exist; do not block unrelated executable-now files.

### Blocking Issue 3
**B** — use existing numbered filenames.

### Blocking Issue 4
A valid real test must come from explicit operational semantics already present. Otherwise:
- structural test only if honestly structural
- else keep todo

---

## Next step

Proceed by:
1. classifying all existing executable spec files into executable-now / structural-only / blocked
2. implementing only the executable-now subset
3. preserving todos for the rest
4. producing the blocking report

---