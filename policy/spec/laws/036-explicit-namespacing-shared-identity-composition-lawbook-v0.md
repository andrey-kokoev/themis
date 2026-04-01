---
id: b8f3nx
title: "Explicit Namespacing / Shared-Identity Composition Lawbook v0"
kind: lawbook
order: 36
source: populated-for-semantic-tests
---

# Explicit Namespacing / Shared-Identity Composition Lawbook v0

## Status
Semantically populated for explicit-relaxation composition.

## Object
This lawbook defines controlled relaxation of conservative composition through explicit declarations only.

## Scope

### In Scope
- Explicit namespace declarations
- Explicit role aliasing
- Explicit shared subject identity
- Lifted role-id resolution
- Relation resolution after lifting

### Out of Scope
- Import syntax
- Wildcard imports
- Automatic namespace inference
- Automatic alias inference
- Automatic shared-identity inference
- Override semantics

## Law Family E1 — Namespace Laws

### E1.1: Explicit Namespaces
Namespaces must be declared explicitly via `NamespaceDecl`. No inference from module id, workspace id, path, or repo structure.

### E1.2: Namespace Uniqueness
Two modules may not declare the same namespace. If they do, composition fails.

### E1.3: No Inferred Namespaces
A module without an explicit namespace declaration uses its local role ids without prefix.

## Law Family E2 — Alias Laws

### E2.1: Explicit Aliases
Role aliases must be declared explicitly via `RoleAliasDecl`. No alias may be inferred from spelling similarity.

### E2.2: Lifting Rule
For `(moduleId, localRoleId)`, the lifted composed role id is:
1. If exact alias exists → use `composedRoleId` from alias
2. Else if module has explicit namespace → use `<namespace>::<localRoleId>`
3. Else use raw `localRoleId`

### E2.3: Alias Collision Failure
If two lifted roles resolve to the same `composedRoleId`, composition fails.

## Law Family E3 — Shared-Identity Laws

### E3.1: Shared Identity Illegal by Default
Shared subject identity is illegal unless explicitly declared.

### E3.2: Explicit Shared Identity Declaration
Shared subject identity is legal only through `SharedIdentityDecl` matching exact subject id and exact set of participating modules.

### E3.3: Shared Identity Does Not Merge Roles
Even when subject identity is declared shared, roles remain distinct unless also lifted distinctly.

## Law Family E4 — Relation Resolution Laws

### E4.1: Post-Lifting Resolution
Relation endpoints must resolve in the lifted composed role-id space.

### E4.2: Ambiguity Failure
If after lifting any endpoint is ambiguous, composition fails.

### E4.3: Missing Endpoint Failure
If after lifting any endpoint is unresolved, composition fails.

## Law Family E5 — Strictness Preservation

### E5.1: Persistence Strictness
Explicit composition does not relax persistence agreement. Any disagreement still fails.

### E5.2: Equivalence Strictness
Explicit composition does not relax equivalence agreement. Any disagreement still fails.

## Conflict Types

| Conflict | Description |
|----------|-------------|
| `NamespaceCollision` | Two modules declare same namespace |
| `AliasCollision` | Two lifted roles resolve to same composed id |
| `UndeclaredSharedIdentity` | Same subject identity without declaration |
| `InvalidSharedIdentityDecl` | Declaration doesn't match actual modules |
| `RelationEndpointAmbiguousAfterAliasing` | Endpoint ambiguous after lifting |
| `PersistenceModeConflict` | Different persistence modes (inherited) |
| `EquivalenceConflict` | Different equivalence modes (inherited) |

## Closure Criterion

This explicit composition object is locally closed when:
- all E1-E5 laws are explicitly defined (✓ above)
- lifting rule is deterministic and implemented
- shared identity validation works
- no relaxation occurs without explicit declaration
- strictness from conservative composition is preserved
