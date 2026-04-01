---
id: m1v7ka
title: "Multi-Workspace / Module Composition Lawbook v0"
kind: lawbook
order: 30
source: populated-for-semantic-tests
---

# Multi-Workspace / Module Composition Lawbook v0

## Status
Semantically populated for conservative composition.

## Object
This lawbook defines deterministic, collision-failing composition of multiple workspace modules.

## Scope

### In Scope
Conservative composition of Workspace objects:
- Canonical module ordering
- Collision detection and failure
- Agreement validation
- Successful composition output

### Out of Scope
- Explicit namespacing
- Shared identity declarations  
- Aliasing
- Import syntax
- Override semantics
- Module registries

## Law Family C1 — Canonical Ordering

### C1.1: Module Order Determinism
Modules must be composed in deterministic lexical order by `moduleId`. Input array order does not matter.

### C1.2: Output Role Order
Roles in composed output sorted by `role.id` (lexicographically ascending).

### C1.3: Output Relation Order
Relations sorted lexicographically by tuple `(kind, source, target)`.

### C1.4: Output Context Order
Context entries sorted by key (lexicographically ascending).

## Law Family C2 — Collision Failure

### C2.1: Workspace ID Collision
If two modules have the same workspace name, composition fails.

### C2.2: Role ID Collision
If two modules contain the same unqualified `role.id`, composition fails.

### C2.3: Subject Identity Collision
If two modules contain the same `role.subject.identity`, composition fails.

### C2.4: Context Key Value Collision
If the same context key appears in multiple modules with different values, composition fails.

## Law Family C3 — Agreement Rules

### C3.1: Persistence Agreement
All modules must have the same `persistence` mode. Otherwise composition fails.

### C3.2: Equivalence Agreement
All modules must have the same `equivalence` name. Otherwise composition fails.

## Law Family C4 — Relation Resolution

### C4.1: Endpoint Uniqueness
After role union, every relation endpoint must resolve to exactly one composed role id.

### C4.2: Missing Endpoint Failure
If any relation `source` or `target` does not resolve uniquely, composition fails.

## Law Family C5 — Success Shape

### C5.1: Composed Workspace ID
If composition succeeds, composed workspace id is:
```
<moduleId-1>+<moduleId-2>+...
```
using canonical module order.

### C5.2: Deterministic Output
Successful composition produces one deterministic composed workspace with all items properly ordered.

### C5.3: Context Deduplication
If the same context key appears with equal values across modules, it appears once in output.

## Conflict Types

| Conflict | Description |
|----------|-------------|
| `WorkspaceIdCollision` | Two modules share same workspace id |
| `RoleIdCollision` | Two roles share same id |
| `SubjectCollision` | Two subjects share same identity |
| `ContextKeyCollision` | Same key with different values |
| `RelationEndpointMissing` | Relation endpoint doesn't resolve |
| `PersistenceModeConflict` | Different persistence modes |
| `EquivalenceConflict` | Different equivalence modes |

## Closure Criterion

This composition object is locally closed when:
- all C1-C5 laws are explicitly defined (✓ above)
- composition implementation enforces all collision rules
- composition either succeeds deterministically or fails with explicit conflicts
- no implicit merge behavior exists
