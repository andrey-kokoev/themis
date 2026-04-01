`````markdown id="agnt01"
# THEMIS Agent Instructions v0

Purpose: convert PDA outputs (lawbooks, executable specs, notes) into a
working, versioned repository with reproducible behavior.

This is a **deterministic build of the corpus**, not an interpretation task.

---

## 0. Non-negotiable invariants

1. **No content invention**
   - Agent must not modify semantic content of outputs.
   - Only allowed transformations:
     - file wrapping (front matter)
     - directory placement
     - stable ordering
     - formatting normalization

2. **Source vs non-source separation**
   - `/policy/src` and `/policy/spec` are authoritative.
   - `/generated`, `/dist`, `/state`, `/cache` are not.

3. **Determinism**
   - Same inputs → identical repo state.
   - File names, order, and structure must be stable.

4. **No implicit merging**
   - Each output block becomes exactly one file.

---

## 1. Inputs

Agent receives one of:

- inline **file packets**
- or raw **quad-backtick blocks**
- or already structured markdown

Primary target: normalize into `/policy/spec`.

---

## 2. Repository bootstrap

If repo does not exist:

```bash
git init themis
cd themis
```

Create scaffold:

```text
/policy
  /src
  /spec
    /laws
    /tests
    /notes
  /generated
  /dist
  /state
  /cache
```

Create root files:

- `README.md`
- `/policy/.gitignore`

---

## 3. Block → file transformation

### Case A — file packet format

Input:

```text
=== FILE: /policy/spec/laws/001-foo.md ===
...content...
=== END FILE ===
```

Action:

- write file exactly as given
- ensure directory exists
- do not modify content

---

### Case B — quad-backtick blocks

Input:

````text
````markdown id="abc123"
# Title
...
`````

````

Transform into:

```markdown
---
id: abc123
title: "Title"
kind: <derived>
order: <sequential>
---

# Title
...
```

---

## 4. Kind classification

Determine `kind` from title:

| condition | kind | directory |
|----------|------|----------|
| contains "Lawbook" | lawbook | `/spec/laws` |
| contains "Executable Spec" | executable-spec | `/spec/tests` |
| otherwise | note | `/spec/notes` |

---

## 5. File naming

### Rule

```text
<order>-<slug>.md
```

### Slug

- lowercase
- alphanumeric + hyphen
- derived from title

Example:

```text
014-canonical-rendering-formatter-lawbook.md
```

---

## 6. Ordering

- Order = appearance sequence in input stream
- Must be stable
- Must not be recomputed later

---

## 7. Directory placement

| kind | path |
|------|------|
| lawbook | `/policy/spec/laws/` |
| executable-spec | `/policy/spec/tests/` |
| note | `/policy/spec/notes/` |

---

## 8. Index generation

Create:

```
/policy/spec/notes/INDEX.md
```

Content:

- ordered list of all files
- grouped by kind

---

## 9. Closure file

Ensure existence:

```
/policy/spec/notes/CLOSURE.md
```

If provided → write as-is  
If missing → do not invent

---

## 10. Graph file

Ensure:

```
/policy/spec/notes/GRAPH.md
```

Write only if provided.

---

## 11. Validation pass

After writing files, agent must verify:

### V1 — uniqueness
- no duplicate filenames
- no duplicate `id`

### V2 — ordering consistency
- no gaps in numbering
- strictly increasing

### V3 — structure
- all files under correct directories

### V4 — front matter completeness
Each file must contain:
- id
- title
- kind
- order

---

## 12. Git commit

```bash
git add .
git commit -m "themis: import PDA corpus (deterministic)"
```

---

## 13. Idempotency rule

Re-running agent on same inputs must produce:

- zero diff (`git diff` empty)

---

## 14. Forbidden actions

Agent must NOT:

- rewrite titles
- merge files
- infer missing lawbooks
- reorder for aesthetics
- collapse sections
- convert markdown semantics
- introduce summaries

---

## 15. Optional enhancements (allowed)

- generate `/spec/notes/INDEX.md`
- generate coverage tables if explicitly provided
- generate file tree visualization

---

## 16. Execution modes

### Mode 1 — bootstrap
- create repo
- ingest all outputs

### Mode 2 — append
- add new blocks with continued ordering

### Mode 3 — verify
- run validation only

---

## 17. Completion condition

Agent is done when:

- all input blocks are mapped to files
- validation passes
- repo is commit-ready

---

## 18. Compression

Agent behavior reduces to:

> map each PDA artifact to exactly one file in a deterministic, validated repository without altering semantics.

---

## Next best move

Run agent in **bootstrap mode** with current outputs, then immediately run validation + commit.
````
