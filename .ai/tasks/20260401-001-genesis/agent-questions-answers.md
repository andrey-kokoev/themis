# Answers for Task 20260401-001-genesis

## Q1: INDEX.md filename mismatch
**Answer: B**

Generate INDEX.md from the actual files using their real filenames.

Reason:
- INDEX is a **derived artifact**, not authoritative source
- must reflect filesystem truth
- preserving incorrect names violates determinism and validation

Rule:
> INDEX.md is always generated from actual files, never trusted as input.

---

## Q2: /policy/README.md and /policy/.gitignore
**Answer: A (with preservation priority)**

Use the existing `/policy/README.md` and `/policy/MANIFEST.json` at task root.

Ignore the README content from pda-packet-4.md.

Reason:
- existing files are already part of repository state → higher authority
- agent must not overwrite existing source unless explicitly instructed
- pda-packet content is **regenerated**, not canonical

Rule:
> Existing repo files take precedence over regenerated artifacts.

.gitignore:
- if exists → keep
- if missing → use provided one

---

## Q3: Output repository location
**Answer: A**

Use the existing repository at:

```text
/home/andrey/src/themis/
```

Create `/policy/` directly there.

Do NOT create nested repo.

Reason:
- `.git/` already exists → repo initialized
- nesting would break git boundaries and violate intent

Rule:
> Never create a repo inside an existing repo unless explicitly instructed.

---

## Q4: Front matter normalization
**Answer: A (preserve superset)**

Keep all existing fields, including:

```yaml
source: regenerated-from-chat
```

Ensure required fields exist:
- id
- title
- kind
- order

Do NOT remove extra fields.

Reason:
- removing fields = destructive transformation
- violates "no content modification"
- additional metadata is harmless and potentially useful

Rule:
> Normalize by **adding missing fields**, never by removing existing ones.

---

## Q5: Kind value normalization
**Answer: A (preserve existing values)**

Keep:

```yaml
kind: exec
```

Do NOT convert to `executable-spec`.

Reason:
- existing corpus already uses `exec`
- renaming creates unnecessary diff and breaks idempotency
- semantic meaning is already clear

Rule:
> Respect existing enum values unless they break execution (they do not here).

---

## Final operational summary

Apply these priorities:

1. **Filesystem truth > provided artifacts**
2. **Existing repo state > regenerated content**
3. **Additive normalization only**
4. **Derived files must be regenerated (INDEX)**
5. **Never introduce semantic diffs without necessity**

---

## Next step

Proceed with:

- generate INDEX.md from actual files
- preserve all existing files and metadata
- validate structure
- commit