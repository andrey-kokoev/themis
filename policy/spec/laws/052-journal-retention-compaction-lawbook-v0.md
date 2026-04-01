---
id: "052"
title: "Journal Retention and Compaction Lawbook v0"
kind: lawbook
order: 52
dependencies: ["050"]
---

# Journal Retention and Compaction Lawbook v0

## Overview

This lawbook defines replay-preserving retention and compaction for the runtime journal.

---

## Law Family R1: Prefix Truncation

### R1.1 — Only prefix may be compacted
Given records `[r1, r2, ..., rn]`, may replace `[r1 ... rk]` with `snapshot(k)`.

**Must not**: Delete from middle or tail.

---

## Law Family R2: Snapshot Completeness

### R2.1 — Snapshot encodes replay-relevant state
Snapshot at `seq = k` must contain:
- All integration-relevant state
- Effective operator state
- Workspace identity (via hash)

### R2.2 — Replay equivalence
`replay(snapshot + tail) == replay(full journal)`

---

## Law Family R3: Determinism

### R3.1 — Snapshot is deterministic
Given same prefix `[r1 ... rk]`, snapshot must be identical.

**Must not**: Depend on wall clock, environment, or backend.

---

## Law Family R4: Tail Preservation

### R4.1 — Tail remains unchanged
Records after snapshot point `[rk+1 ... rn]` must not be rewritten.

---

## Law Family R5: No Semantic Loss

### R5.1 — Effective state preserved
Compaction must not lose:
- Conflict acknowledgment status
- Rebind request state
- Note state
- Integration verdict reproducibility

---

## Law Family R6: Snapshot Sufficiency

### R6.1 — No backward references required
Replay of compacted journal must not require access to truncated prefix.
