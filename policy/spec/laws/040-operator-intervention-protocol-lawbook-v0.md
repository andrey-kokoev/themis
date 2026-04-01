---
id: "040"
title: "Operator Intervention Protocol Lawbook v0"
kind: lawbook
order: 40
dependencies: ["038"]
---

# Operator Intervention Protocol Lawbook v0

## Overview

This lawbook defines the minimal operator intervention protocol for Themis runtime.

---

## Law Family O1: Closed Action-Set Laws

### O1.1 — Only declared actions admissible
Only explicitly declared operator action tags are admissible.

**Closed set**:
- `RetryIntegration`
- `AcknowledgeConflict`
- `RequestRebind`
- `RecordNote`

**Must not**: Accept generic override, force, or arbitrary command actions.

### O1.2 — No action mutation of source
No operator action may mutate:
- `/policy/src`
- `/policy/spec`
- Kernel objects as source of truth

**Must**: Operator actions affect only runtime behavior, journaled history, and operational flow.

---

## Law Family O2: Admissibility Laws

### O2.1 — RetryIntegration admissibility
Admissible iff target workspace exists.

**Replayable**: yes  
**Reversible**: no

### O2.2 — AcknowledgeConflict admissibility
Admissible iff:
- Target workspace exists
- Named conflict exists in latest integration verdict

**Replayable**: yes  
**Reversible**: yes

### O2.3 — RequestRebind admissibility
Admissible iff:
- Target role exists
- Target profile is known
- Request does not mutate declarative role identity

**Replayable**: yes  
**Reversible**: yes

### O2.4 — RecordNote admissibility
Admissible iff:
- Scope target exists
- Note is non-empty

**Replayable**: yes  
**Reversible**: yes

---

## Law Family O3: No Semantic Override Laws

### O3.1 — Actions do not assert satisfaction
No operator action may assert:
- Role satisfied
- Workspace satisfied
- Conflict erased from semantic reality

### O3.2 — Acknowledgment is not erasure
`AcknowledgeConflict` records operator acknowledgment only.

**Must not**: Remove underlying conflict from kernel/integration truth.

---

## Law Family O4: Replay Laws

### O4.1 — Replay preserves order
Operator actions replay in original order.

### O4.2 — Inadmissible replay fails explicitly
Replay of action that becomes inadmissible under changed state must fail explicitly.

**Must not**: Silently succeed.

---

## Law Family O5: Journal Integration Laws

### O5.1 — Actions are first-class records
Operator actions are journalable as runtime history.

### O5.2 — Actions are not hidden side effects
All operator interventions must be visible in journal.
