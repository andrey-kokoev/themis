---
id: "050"
title: "End-to-End Scenario Conformance Lawbook v0"
kind: lawbook
order: 50
dependencies: ["048"]
---

# End-to-End Scenario Conformance Lawbook v0

## Overview

This lawbook defines end-to-end conformance testing for the complete Themis pipeline.

---

## Law Family E1: Scenario Authority

### E1.1 — Fixtures are source
Scenario inputs live under `/policy/spec/fixtures/scenarios/` as authoritative source.

### E1.2 — Bounded expected outputs
Each scenario specifies expected outputs for stages it exercises.

---

## Law Family E2: Pipeline Coverage

### E2.1 — Full stack exercise
Scenarios must exercise:
```
source → parse → lower → compose → integrate → journal → replay
```

### E2.2 — Stage visibility
Failing scenarios report:
- Which stage failed
- Expected output
- Actual output

---

## Law Family E3: Determinism

### E3.1 — Repeatable execution
Same scenario run twice produces identical results at each stage.

---

## Law Family E4: No Semantic Hacks

### E4.1 — Harness is orchestration only
Scenario harness may not add ad hoc fixes or special-case logic.

**Must**: Fix the layer, not the harness.

---

## Law Family E5: Canonical Scenarios

### E5.1 — Minimal Single Workspace Success
One module, one workspace, one role, valid facts, admissible integration.

### E5.2 — Conservative Composition Failure
Two modules with collision, composition fails before runtime.

### E5.3 — Explicit Composition Success
Two modules with namespace policy, successful composition and integration.
