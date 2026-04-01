---
id: q5h8zd
title: "Operator State / Durable Runtime Journal Lawbook v0"
kind: lawbook
order: 34
source: populated-for-semantic-tests
---

# Operator State / Durable Runtime Journal Lawbook v0

## Status
Semantically populated for durable runtime journal.

## Object
This lawbook defines append-only journal semantics for recording runtime integration history with deterministic replay.

## Scope

### In Scope
- Append-only record storage
- Monotone sequencing
- Workspace identity via canonical hash
- Deterministic replay

### Out of Scope
- External storage engines
- Distributed logs
- Compaction
- Retention policies
- Access control
- Streaming APIs

## Law Family J1 — Append-Only

### J1.1: No Mutation
Records are only appended. No deletion or in-place mutation of past records.

### J1.2: Immutable History
Once a record is appended, it is immutable.

## Law Family J2 — Sequencing

### J2.1: Strictly Increasing Sequence
`seq` starts at 1 and increments by 1 per append. Never decreases, never skips.

### J2.2: Logical Time
`at` is monotone integer derived from append order (not wall clock). Strictly increasing with `seq`.

## Law Family J3 — Identity

### J3.1: Workspace Hash
`workspaceHash` is derived from canonical rendering string. Identical workspace → identical hash.

### J3.2: Hash Stability
Same canonical render always produces same hash.

## Law Family J4 — Replay Correctness

### J4.1: Deterministic Replay
Re-running `integrate(workspace, facts)` for each record must reproduce the exact same `verdict`.

### J4.2: Mismatch Detection
Any difference between recomputed and stored verdict is a replay failure.

### J4.3: Replay Failure Reporting
Replay stops at first mismatch and reports the failing sequence number.

## Law Family J5 — Non-Authority

### J5.1: Observational Only
Journal does not alter workspace, introduce facts, or affect admissibility logic.

### J5.2: Non-Authoritative
Journal is not source. It records observations without influencing semantics.

## Record Types

```typescript
type JournalRecord = {
  tag: "IntegrationEvaluated"
  seq: number
  at: number           // logical timestamp
  workspaceHash: string
  facts: Fact[]
  verdict: IntegrationVerdict
}

type Journal = {
  records: JournalRecord[]
  nextSeq: number
}
```

## Conflict Types

| Conflict | Description |
|----------|-------------|
| `ReplayMismatch` | Recomputed verdict differs from stored |
| `SeqGap` | Non-consecutive sequence numbers |
| `TimeDecreased` | Logical time not monotone |

## Closure Criterion

This journal object is locally closed when:
- all J1-J5 laws are explicitly defined (✓ above)
- `append(journal, workspace, facts)` is implemented
- `replay(journal, workspaceResolver)` is implemented
- replay is deterministic and detects mismatches
