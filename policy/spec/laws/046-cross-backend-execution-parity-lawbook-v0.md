---
id: "046"
title: "Cross-Backend Execution Parity Lawbook v0"
kind: lawbook
order: 46
dependencies: ["044"]
---

# Cross-Backend Execution Parity Lawbook v0

## Overview

This lawbook defines parity constraints between WT+WSL and tmux backend realizations.

---

## Law Family P1: Intent Parity

### P1.1 — Action-class intent alignment
Same action class must yield same intent class in both backends.

**Mapping**:
- `command` ↔ command-intent plan
- `attach` ↔ attach-intent plan  
- `tail` ↔ tail-intent plan

---

## Law Family P2: No Class Drift

### P2.1 — Action class preservation
**Must not**: Rewrite one semantic class into another.

Example violation: `attach` → `InvokeWslCommand` (instead of `AttachTarget`).

---

## Law Family P3: Selector Explicitness Parity

### P3.1 — Optional selectors remain optional
If upstream omits selectors, neither backend may invent them.

### P3.2 — Explicit selectors propagate
If upstream provides selectors, backend may propagate only meaningful ones.

**Note**: WT+WSL uses profile/distro; tmux uses window/pane. Parity is about explicitness discipline, not identical fields.

---

## Law Family P4: Observation Parity

### P4.1 — Aligned observation scope
Both backends must stay within same observation category envelope:
- location/container state
- backend selector state
- command result

---

## Law Family P5: Non-Semantic Backend Plans

### P5.1 — No semantic field leak
Neither backend plan may contain:
- satisfied
- admissible
- preserved
- conflictResolved

---

## Law Family P6: Deterministic Parity Check

### P6.1 — Same input, same verdict
Parity checking must be deterministic given same semantic input pair.
