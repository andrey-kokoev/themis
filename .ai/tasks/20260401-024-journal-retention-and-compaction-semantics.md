--- .ai/tasks/20260401-024-journal-retention-and-compaction-semantics.md ---
# Task 20260401-024: Journal Retention and Compaction Semantics

**Objective**: Define and implement a **closed, replay-preserving retention and compaction model** for the runtime journal so that unbounded history is replaced by lawfully equivalent bounded representations.

---

## Current State

After Task `20260401-023`:

- journal is append-only
- replay is deterministic
- operator actions and compensation are journaled
- effective operator state is reconstructible
- end-to-end scenarios pass

However:

- journal grows without bound
- no definition of when history may be truncated
- no equivalence relation between full history and compacted history
- no snapshot semantics

So the system is:

> replay-correct, but not yet closed under time

This task fixes that.

---

## Architectural Decision

Compaction is **not deletion**.

Compaction must:

- preserve replay semantics
- preserve effective operator state
- preserve integration verdict reproducibility
- define a lawful equivalence between:
  - full journal
  - compacted journal

The rule is:

> a compacted journal must be observationally equivalent to the original journal under all defined replay and state reconstruction functions

---

## Constraint

Do **not** implement:

- storage engines
- time-based TTL
- size-based eviction heuristics
- distributed log compaction
- partial replay shortcuts
- garbage collection tied to external systems

This task is only about:

> semantic definition of retention, truncation, and snapshot equivalence

---

## Scope

Extend journal model with:

```ts
type JournalSnapshot = {
  seq: number
  workspaceHashes: Record<string, string>
  integrationVerdicts: Record<string, IntegrationVerdict>
  effectiveOperatorState: EffectiveOperatorState
}
```

And compaction result:

```ts
type CompactedJournal = {
  snapshot: JournalSnapshot
  tail: JournalRecord[]
}
```

---

## Policy Decisions

### 1. Prefix truncation law

Only a **prefix** of the journal may be compacted.

Given:

```text
records = [r1, r2, ..., rn]
```

You may replace:

```text
[r1 ... rk] + [rk+1 ... rn]
```

with:

```text
snapshot(k) + [rk+1 ... rn]
```

No middle deletion allowed.

---

### 2. Snapshot completeness law

A snapshot at `seq = k` must contain enough information so that:

```text
replay(snapshot + tail) == replay(full journal)
```

This requires snapshot to encode:

- all integration-relevant state
- effective operator state
- workspace identity (via hash)

---

### 3. Replay equivalence law

For any journal `J` and its compacted form `J'`:

```text
replay(J) == replay(J')
```

and:

```text
effectiveOperatorState(J) == effectiveOperatorState(J')
```

This is the core invariant.

---

### 4. Snapshot determinism

Given the same prefix `[r1 ... rk]`, snapshot must be identical:

```text
snapshot(k) is deterministic
```

No dependence on:
- wall clock
- environment
- backend

---

### 5. Tail preservation law

Records after the snapshot point must remain unchanged:

```text
tail = [rk+1 ... rn]
```

No rewriting or normalization of tail.

---

### 6. No semantic loss

Compaction must not lose:

- conflict acknowledgment status (via effective operator state)
- rebind request state
- note state
- integration verdict reproducibility

---

### 7. No backward reference requirement

After compaction:

- replay must not require access to truncated prefix
- snapshot is sufficient base state

---

### 8. Idempotent compaction

Applying compaction twice at same boundary must yield identical result:

```text
compact(compact(J, k), k) == compact(J, k)
```

---

### 9. Monotone compaction boundary

If you compact at `k1` and later at `k2 > k1`, result must be equivalent to direct compaction at `k2`.

---

## Deliverables

- [ ] Create journal retention & compaction lawbook
- [ ] Create compaction executable spec
- [ ] Implement:
  ```ts
  snapshot(journal, k): JournalSnapshot
  compact(journal, k): CompactedJournal
  replayCompacted(compactedJournal): ReplayResult
  ```
- [ ] Replace compaction-layer `todo` tests with real tests
- [ ] Ensure replay equivalence invariants hold

---

## Required Law Families

### Law family R1 — Prefix truncation
- only prefix may be compacted

### Law family R2 — Snapshot completeness
- snapshot fully captures replay-relevant state

### Law family R3 — Replay equivalence
- compacted and full journal yield identical replay results

### Law family R4 — Determinism
- snapshot and compaction are deterministic

### Law family R5 — No semantic loss
- operator state and integration semantics preserved

---

## Test Plan

Implement tests for:

1. **snapshot at k produces deterministic result**
2. **compacted journal replays identically to full journal**
3. **effective operator state matches between full and compacted**
4. **prefix truncation removes only prefix**
5. **tail remains unchanged after compaction**
6. **compaction is idempotent at same k**
7. **compaction at k2 matches direct compaction vs sequential**
8. **replay does not require truncated records**
9. **integration verdict reproducibility preserved**
10. **compaction does not alter subsequent append behavior**

---

## Acceptance Criteria

- [ ] Lawbook defines snapshot and compaction semantics explicitly
- [ ] Executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All compaction tests pass
- [ ] Replay equivalence holds
- [ ] Journal is now bounded under lawful compaction

---

## Non-Goals

- Do not implement physical storage compaction
- Do not implement retention policies (time/size)
- Do not implement distributed log semantics
- Do not introduce partial replay shortcuts
- Do not modify journal append semantics

---

## Failure Policy

If snapshot cannot capture sufficient state to guarantee replay equivalence:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-024-journal-retention-and-compaction-semantics.questions.md
   ```
3. identify missing invariant explicitly
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

Without compaction, journal introduces:

> unbounded time dimension without law

This is a true PDA violation.

Compaction introduces:

> lawful equivalence classes over histories

which closes the time dimension.

---

## Next Step

After completion:

- rerun journal + operator + scenario tests
- verify replay equivalence across compacted histories
- then proceed to:
  - module/import resolution semantics (final closure step)

---