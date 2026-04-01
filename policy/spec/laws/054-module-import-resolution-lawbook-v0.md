---
id: "054"
title: "Module / Import Resolution Lawbook v0"
kind: lawbook
order: 54
dependencies: ["052"]
---

# Module / Import Resolution Lawbook v0

## Overview

This lawbook defines deterministic module/import resolution semantics.

---

## Law Family M1: Identity Laws

### M1.1 — Module identity is exact `moduleId`
Identity is declared `module "<module-id>"` only.

**Must not**: Infer from filename, directory, or workspace.

### M1.2 — Duplicate identities illegal
Registry construction fails if two modules share same `moduleId`.

---

## Law Family M2: Binding Laws

### M2.1 — Exact lookup only
Import `import "<module-id>"` resolves iff exact `moduleId` exists.

**Must not**: Use fuzzy matching or fallback search.

### M2.2 — Missing imports fail
Absent imported `moduleId` causes explicit resolution failure.

---

## Law Family M3: Graph Laws

### M3.1 — Deterministic traversal
Imports processed in lexical order of `moduleId`.

### M3.2 — Root inclusion
Resolved graph always includes root module.

### M3.3 — No partial graph
Resolution fails entirely if any import unresolved.

---

## Law Family M4: Cycle Laws

### M4.1 — Cycles illegal
Import cycles cause explicit resolution failure.

### M4.2 — Cycle error explicit
Cycle path reported in error.

---

## Law Family M5: Separation Laws

### M5.1 — Resolution builds graph only
Composition remains separate stage.

---

## Law Family M6: Determinism

### M6.1 — Re-resolution identity
Same root and registry yields same verdict.
