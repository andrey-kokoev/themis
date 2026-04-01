# Task 20260401-017: Import / Module Surface Syntax Introduction

**Objective**: Introduce a **minimal, explicit surface syntax** for module composition so that conservative composition and explicit composition can be authored in the DSL itself rather than only through external policy objects.

---

## Current State

After Task `20260401-016`:

- kernel is explicit
- downstream layers are rebound to the kernel
- conservative composition exists semantically
- explicit composition exists semantically
- namespacing / alias / shared-identity policy exists semantically

However:

- there is no author-facing DSL surface for module composition
- composition policy still lives outside the language surface
- imports/namespaces/aliases/shared identities cannot yet be expressed declaratively in source files

So the system is:

> semantically compositional, but not yet linguistically compositional

This task fixes that.

---

## Architectural Decision

Import / module syntax is a **surface-language introduction task**, not a semantic expansion task.

It must:

- expose already-defined composition semantics
- remain minimal
- avoid wildcard/generalized import machinery
- map directly to explicit composition policy and module references

This task must not invent a new composition model.

The rule is:

> surface syntax may reveal existing semantics, but may not broaden them

---

## Constraint

Do **not** implement:

- registry/package resolution
- version constraints
- wildcard imports
- selective export visibility
- remote fetching
- override precedence
- merge semantics beyond what explicit composition already allows

This task is only about:

> the smallest declarative syntax that can express existing module composition semantics

---

## Scope

Introduce minimal top-level module forms for:

1. module declaration
2. import declaration
3. namespace declaration
4. role alias declaration
5. shared identity declaration

These forms must lower into already-existing:

- `ModuleRef`
- `ExplicitCompositionPolicy`

They must not bypass composition validation.

---

## Proposed Minimal Surface Syntax

### Module header

```text
module "<module-id>" {
  workspace "<workspace-id>" {
    ...
  }
}
```

A source file contains exactly one `module`.

---

### Import declaration

```text
import "<module-id>"
```

Imports are identifiers only in this task.  
No path or registry semantics yet.

---

### Namespace declaration

```text
namespace "<module-id>" as "<namespace>"
```

---

### Role alias declaration

```text
alias role "<module-id>"."<local-role-id>" as "<composed-role-id>"
```

---

### Shared identity declaration

```text
share subject "<subject-id>" across "<module-a>", "<module-b>", ...
```

These declarations must appear at module top level, outside `workspace`.

---

## Policy Decisions

### 1. Single module root

A file may contain exactly one:

```text
module "<module-id>" { ... }
```

No multiple module roots.

---

### 2. Module id is explicit

`moduleId` is author-declared in syntax.

It must not be inferred from:
- file name
- directory
- repo path

---

### 3. Imports are symbolic only

In this task, `import "<module-id>"` only introduces a symbolic dependency edge.

It does not resolve:
- paths
- packages
- versions

Resolution remains external.

---

### 4. Namespace/alias/share declarations lower directly

Each surface declaration lowers into the already-existing explicit composition policy types:

- `NamespaceDecl`
- `RoleAliasDecl`
- `SharedIdentityDecl`

No extra semantics added.

---

### 5. Workspace body remains the existing parser subset

Inside:

```text
workspace "<workspace-id>" { ... }
```

use the existing populated parser subset only.

Do not extend the internal workspace grammar here.

---

### 6. Ordering rules

Inside a module, canonical surface order is:

1. imports
2. namespace declarations
3. alias declarations
4. shared identity declarations
5. workspace

This is surface order only.

---

### 7. Lowering rules

Parsing a module file must produce:

```ts
type SurfaceModule = {
  moduleId: string
  imports: string[]
  namespaces: NamespaceDecl[]
  aliases: RoleAliasDecl[]
  sharedIdentities: SharedIdentityDecl[]
  workspace: SurfaceWorkspace
}
```

Lowering to composition inputs must produce:

- one `ModuleRef`
- one partial `ExplicitCompositionPolicy`
- one list of imported module ids

---

### 8. Failure rules

Parser must reject:

- multiple module roots
- missing workspace inside module
- namespace/alias/share declarations inside workspace
- malformed alias target
- malformed shared subject declaration
- trailing top-level content after module close

---

## Deliverables

- [ ] Create module/import surface syntax lawbook
- [ ] Create module/import executable spec
- [ ] Extend parser subset to include module root and top-level composition declarations
- [ ] Define `SurfaceModule` AST
- [ ] Define lowering from `SurfaceModule` to `ModuleRef + ExplicitCompositionPolicy`
- [ ] Replace module/import `todo` tests with real tests

---

## Required Law Families

### Law family M1 — Module root laws
- exactly one module root
- explicit module id
- exactly one workspace inside module

### Law family M2 — Import laws
- imports are symbolic identifiers only
- no path/version semantics in v0

### Law family M3 — Explicit composition declaration laws
- namespace/alias/share syntax lowers directly to explicit composition policy
- no semantic broadening

### Law family M4 — Placement laws
- composition declarations only at module top level
- workspace-internal grammar unchanged

### Law family M5 — Lowering laws
- parsed module lowers deterministically to composition inputs

---

## Test Plan

Implement tests for:

1. **parses minimal module with workspace**
2. **rejects file with two module roots**
3. **parses import declarations in canonical order**
4. **parses namespace declaration and lowers correctly**
5. **parses alias declaration and lowers correctly**
6. **parses shared subject declaration and lowers correctly**
7. **rejects namespace declaration inside workspace**
8. **rejects malformed alias syntax**
9. **rejects malformed shared subject syntax**
10. **module lower result is deterministic**

---

## Required Output Shapes

At minimum:

```ts
type SurfaceModule = {
  tag: "Module"
  moduleId: string
  imports: string[]
  namespaces: NamespaceDecl[]
  aliases: RoleAliasDecl[]
  sharedIdentities: SharedIdentityDecl[]
  workspace: SurfaceWorkspace
}
```

and:

```ts
type LoweredModule = {
  module: ModuleRef
  policy: ExplicitCompositionPolicy
  imports: string[]
}
```

Do not add richer import resolution structures in this task.

---

## Acceptance Criteria

- [ ] Lawbook contains explicit surface syntax rules
- [ ] Executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] Parsing and lowering are deterministic
- [ ] No new composition semantics are invented
- [ ] Existing workspace subset remains unchanged internally

---

## Non-Goals

- Do not implement path-based imports
- Do not implement version constraints
- Do not implement registry resolution
- Do not implement selective exports
- Do not implement wildcard imports
- Do not implement merge/override semantics

---

## Failure Policy

If the current parser architecture cannot cleanly extend to a module root without breaking the existing workspace subset:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-017-import-module-surface-syntax-introduction.questions.md
   ```
3. identify the exact parser boundary that blocks extension
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

You now have composition semantics, but they remain external to the authored language.

This task makes the language itself capable of expressing:

- module identity
- imports
- explicit namespacing
- aliasing
- shared identity

without introducing extra semantic freedom.

---

## Next Step

After completion:

- rerun parser and composition tests
- update blocking report
- then choose whether the next frontier is:
  - operator intervention protocol
  - concrete backend realization
  - or richer import resolution semantics

---