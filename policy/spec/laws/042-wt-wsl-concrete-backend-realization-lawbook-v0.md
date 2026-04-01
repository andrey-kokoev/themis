---
id: "042"
title: "WT+WSL Concrete Backend Realization Lawbook v0"
kind: lawbook
order: 42
dependencies: ["040"]
---

# WT+WSL Concrete Backend Realization Lawbook v0

## Overview

This lawbook defines concrete backend realization for Windows Terminal + WSL substrate.

---

## Law Family W1: Policy Consumption Laws

### W1.1 — Backend consumes routing decisions
Backend realization must not re-decide:
- whether to create or reuse a tab
- whether profile/distro should be selected
- whether pane reuse is allowed

**Must**: Consume `WtWslOperationalDecision` directly.
**Must not**: Apply heuristics to override `tabDecision`.

---

## Law Family W2: Action Mapping Laws

### W2.1 — Command action mapping
`actionClass: "command"` maps to:
- `LaunchTab` or `ReuseTab`
- then `InvokeWslCommand`

### W2.2 — Attach action mapping
`actionClass: "attach"` maps to:
- `LaunchTab` or `ReuseTab`
- then `AttachTarget`

### W2.3 — Tail action mapping
`actionClass: "tail"` maps to:
- `LaunchTab` or `ReuseTab`
- then `TailSource`

### W2.4 — No class drift
**Must not**: Rewrite `attach` or `tail` into generic shell commands.

---

## Law Family W3: Selector Explicitness Laws

### W3.1 — Absent selectors remain absent
If `selectedProfileName` or `selectedDistroName` is absent:
**Must**: Leave them absent in backend plan.
**Must not**: Fill defaults.

### W3.2 — Explicit selectors propagated
If selectors are present, they pass through unchanged.

---

## Law Family W4: Observation Boundary Laws

### W4.1 — Bounded observation requests
Backend may request only:
- `CaptureTabState`
- `CaptureProfile`
- `CaptureDistro`
- `CaptureCommandResult`

**Must not**: Request focus, title, color, split ratio, or pane heuristics.

---

## Law Family W5: Non-Judgment Laws

### W5.1 — No semantic verdicts
Backend plan must not contain:
- role satisfied
- workspace satisfied
- persistence verdicts
- conflict acknowledgment

**Must**: Emit operational plan only.

---

## Law Family W6: Determinism Laws

### W6.1 — Same input, same plan
Given identical profile and decision, backend emits identical plan.

**Must not**: Branch on environment.
