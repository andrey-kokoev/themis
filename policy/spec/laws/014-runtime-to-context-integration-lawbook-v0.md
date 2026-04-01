---
id: m7c2ql
title: "Runtime-to-Context Integration Lawbook v0"
kind: lawbook
order: 14
source: populated-for-semantic-tests
---

# Runtime-to-Context Integration Lawbook v0

## Status
Semantically populated for runtime integration.

## Object
This lawbook defines deterministic evaluation of observed facts against a composed workspace.

## Scope

### In Scope
- Fact observation and matching
- Role satisfaction judgment
- Relation validation
- Admissibility verdict

### Out of Scope
- Persistence side-effects
- Buffering / logs
- Retries
- External I/O
- Time-dependent behavior
- Reconciliation loops

## Law Family I1 — Role Satisfaction

### I1.1: Role Expectation
Every role in workspace defines an expectation that must be satisfied by observed facts.

### I1.2: Satisfaction Requirements
A role is satisfied iff:
- Its `subject.identity` is observed (via `SubjectObserved` fact)
- At least one matching `realizer` is observed (via `RoleRealized` fact)

### I1.3: Unsatisfied Roles
If either requirement is missing, the role is unsatisfied.

## Law Family I2 — Fact Matching

### I2.1: Subject Matching
A `SubjectObserved` fact matches a role iff:
```
fact.subjectId == role.subject.identity
```
Reference and locator are advisory (not required to match).

### I2.2: Realizer Matching
A `RoleRealized` fact matches a role iff:
```
fact.roleId == role.id
AND
fact.realizerClass == role.realizer.class
```
Payload is not validated.

### I2.3: Witness Satisfaction
A role's witness requirement is satisfied if at least one `RoleRealized` fact matched the role.

## Law Family I3 — Relation Correctness

### I3.1: Declared Relations Must Be Observed
For each declared relation in workspace, a corresponding `RelationObserved` fact must exist.

### I3.2: Observed Relations Must Be Declared
For each `RelationObserved` fact, a corresponding relation must be declared in workspace.

### I3.3: Exact Match Required
Relation matching is by exact `(kind, source, target)` tuple.

## Law Family I4 — Unknown Fact Detection

### I4.1: Unknown Role
If a `RoleRealized` fact references a role id not present in workspace → conflict.

### I4.2: Unknown Subject
If a `SubjectObserved` fact references a subject id not present in any role → conflict.

## Law Family I5 — Admissibility

### I5.1: Admissibility Conditions
Integration is admissible iff:
- No conflicts exist
- All roles are satisfied
- All declared relations are satisfied

### I5.2: Determinism
Given same inputs: `workspace + facts` → same verdict. No ordering sensitivity.

## Fact Types

```typescript
type Fact =
  | { tag: "SubjectObserved"; subjectId: string; reference?: string; locator?: string }
  | { tag: "RoleRealized"; roleId: string; realizerClass: string; payload: string }
  | { tag: "RelationObserved"; kind: string; source: string; target: string }
```

## Conflict Types

| Conflict | Description |
|----------|-------------|
| `UnknownRole` | `RoleRealized` references non-existent role |
| `UnknownSubject` | `SubjectObserved` references subject not in any role |
| `MissingRoleRealization` | Role has no matching realizer fact |
| `MissingSubjectObservation` | Role's subject not observed |
| `MissingRelation` | Declared relation not observed |
| `UnexpectedRelation` | Observed relation not declared |

## Closure Criterion

This runtime integration object is locally closed when:
- all I1-I5 laws are explicitly defined (✓ above)
- `integrate(workspace, facts)` is implemented
- verdict is deterministic
- no source mutation occurs
