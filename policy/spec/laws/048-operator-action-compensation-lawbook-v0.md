---
id: "048"
title: "Operator Action Compensation Lawbook v0"
kind: lawbook
order: 48
dependencies: ["046"]
---

# Operator Action Compensation Lawbook v0

## Overview

This lawbook defines compensation semantics for reversible operator actions.

---

## Law Family C1: Compensation Not Deletion

### C1.1 — Compensation is append-only
Compensating actions are appended to journal, never mutate prior history.

**Must not**: Delete, rewrite, or remove prior operator actions.

### C1.2 — Compensation is explicit
Each compensation must specify what it compensates via `compensatesSeq`.

---

## Law Family C2: Reversible Action Compensation

### C2.1 — AcknowledgeConflict compensation
Compensated by `WithdrawConflictAcknowledgment`.

**Admissible iff**:
- Target acknowledgment exists at `compensatesSeq`
- Acknowledgment is not already withdrawn

### C2.2 — RequestRebind compensation
Compensated by `CancelRebindRequest`.

**Admissible iff**:
- Target rebind request exists at `compensatesSeq`
- Request is not already cancelled

### C2.3 — RecordNote compensation
Compensated by `RetractNote`.

**Admissible iff**:
- Target note exists at `compensatesSeq`
- Note is not already retracted

---

## Law Family C3: Compensation Chain Validity

### C3.1 — No double compensation
An action may be compensated at most once.

### C3.2 — Compensation order preserved
Compensations appear after the actions they compensate in journal order.

---

## Law Family C4: Auditability

### C4.1 — Compensation is fully journaled
All compensation actions are first-class journal records.

### C4.2 — Compensation link is explicit
`compensatesSeq` field creates unambiguous audit trail.
