---
id: n4h6sy
title: "Minimal Concrete Grammar Lawbook v0"
kind: lawbook
order: 1
source: populated-for-semantic-tests
---

# Minimal Concrete Grammar Lawbook v0

## Status
Semantically populated as explicit kernel.

## Object
This lawbook defines the minimal semantic kernel for Themis - the smallest semantic core that all higher layers depend on.

## Scope

### In Scope
- Semantic carriers (Workspace, Role, Subject, Relation)
- Well-formedness predicates
- Normalization
- Equivalence
- Satisfaction

### Out of Scope
- Parser surface syntax
- Source formatting
- Comments
- Runtime backend specifics
- Persistence side-effects

## Law Family K1 — Carrier Laws

### K1.1: Workspace Carriers
A Workspace must contain:
- `id`: non-empty string
- `context`: map of key-value pairs
- `persistence`: persistence mode
- `equivalence`: equivalence reference
- `roles`: non-empty array of Role
- `relations`: array of Relation

### K1.2: Role Carriers
A Role must contain:
- `id`: non-empty string
- `kind`: non-empty string
- `subject`: Subject
- `realizers`: non-empty array
- `witnesses`: non-empty array

### K1.3: Subject Carriers
A Subject must contain:
- `identity`: non-empty string
- `reference`: non-empty string
- `locator`: optional string

### K1.4: Relation Carriers
A Relation must contain:
- `kind`: non-empty string
- `source`: role id (must resolve)
- `target`: role id (must resolve)

## Law Family K2 — Well-Formedness Laws

### K2.1: Workspace Well-Formedness
A Workspace is well-formed iff:
- id is non-empty
- at least one role exists
- all role ids are unique
- all subject identities are unique (unless explicit composition permits)
- all relation endpoints resolve to existing role ids

### K2.2: Role Well-Formedness
A Role is well-formed iff:
- id is non-empty
- kind is non-empty
- subject is well-formed
- at least one realizer exists
- at least one witness exists

### K2.3: Subject Well-Formedness
A Subject is well-formed iff:
- identity is non-empty
- reference is non-empty

## Law Family K3 — Normalization Laws

### K3.1: Deterministic Ordering
Normalization must produce deterministic output:
- roles sorted by `role.id` (lexicographic)
- relations sorted by `(kind, source, target)` tuple
- context entries sorted by key

### K3.2: Semantic Preservation
Normalization must not change semantic content, only ordering.

## Law Family K4 — Equivalence Laws

### K4.1: Equivalence Definition
```
equiv(a, b) := normalize(a) == normalize(b)
```
Two workspaces are equivalent iff their normalizations are structurally equal.

## Law Family K5 — Satisfaction Laws

### K5.1: Role Satisfaction
A Role is satisfied iff:
- its subject identity is observed in facts
- at least one matching realizer class is observed in facts

### K5.2: Workspace Satisfaction
A Workspace is satisfied iff:
- all roles are satisfied
- all declared relations are observed in facts

### K5.3: Pure Judgment
Satisfaction is a pure function: no mutation, no side-effects, deterministic.

## Error Types

| Error | Description |
|-------|-------------|
| `DuplicateRoleId` | Multiple roles share same id |
| `DuplicateSubjectIdentity` | Multiple subjects share same identity |
| `MissingRelationEndpoint` | Relation source or target doesn't resolve |
| `MissingRoleRealizer` | Role has no realizers |
| `MissingRoleWitness` | Role has no witnesses |
| `MissingSubjectIdentity` | Subject identity is empty |
| `MissingSubjectReference` | Subject reference is empty |
| `EmptyWorkspaceId` | Workspace id is empty |

## Closure Criterion

This kernel object is locally closed when:
- all K1-K5 laws are explicitly defined (✓ above)
- wellFormed, normalize, equiv, satisfiedRole, satisfiedWorkspace are implemented
- all operations are pure and deterministic
