---
id: "044"
title: "Tmux Concrete Backend Realization Lawbook v0"
kind: lawbook
order: 44
dependencies: ["042"]
---

# Tmux Concrete Backend Realization Lawbook v0

## Overview

This lawbook defines concrete backend realization for tmux substrate.

---

## Law Family T1: Profile Consumption Laws

### T1.1 — Backend consumes profile directly
Backend realization must not re-interpret profile semantics.

**Must**: Consume `TmuxActionProfile` fields directly.

---

## Law Family T2: Action Mapping Laws

### T2.1 — Command action mapping
`actionClass: "command"` maps to:
- `EnsureSession`
- `EnsureWindow` (if window specified)
- `SendKeys`

### T2.2 — Attach action mapping
`actionClass: "attach"` maps to:
- `EnsureSession`
- `EnsureWindow` (if window specified)
- `AttachTarget`

### T2.3 — Tail action mapping
`actionClass: "tail"` maps to:
- `EnsureSession`
- `EnsureWindow` (if window specified)
- `TailSource`

---

## Law Family T3: Naming Constraint Laws

### T3.1 — Session/window names preserved
Session and window names pass through unchanged.

**Must not**: Apply heuristics or transformations to names.

---

## Law Family T4: Observation Boundary Laws

### T4.1 — Bounded observation requests
Backend may request only:
- `CaptureSessionState`
- `CaptureWindowState`
- `CapturePaneOutput`

---

## Law Family T5: Non-Judgment Laws

### T5.1 — No semantic verdicts
Backend plan must not contain semantic judgment fields.

**Must**: Emit operational plan only.

---

## Law Family T6: Determinism Laws

### T6.1 — Same input, same plan
Given identical profile, backend emits identical plan.
