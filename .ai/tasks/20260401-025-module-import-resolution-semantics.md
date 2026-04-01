# Task 20260401-025: Module / Import Resolution Semantics

**Objective**: Define and implement a **closed, deterministic module/import resolution semantics** so that symbolic module references in the DSL resolve into a lawful module graph with explicit identity, cycle handling, and collision behavior.

---

## Current State

After Task `20260401-024`:

- parser subset is concrete
- canonical rendering is deterministic
- conservative and explicit composition are executable
- kernel is explicit
- runtime integration and journal are executable
- journal compaction is lawful
- module/import surface syntax exists

However:

- `import "<module-id>"` is still only symbolic
- there is no explicit module identity space
- there is no resolution function from module ids to modules
- there is no cycle semantics
- there is no closure over the module graph

So the system is:

> syntactically modular, but not yet semantically closed over module references

This task fixes that.

---

## Architectural Decision

Import resolution is **identity binding**, not fetch policy.

It must define:

- what a module identity is
- how an import binds to a module
- how the import graph is constructed
- what happens when resolution fails
- what happens when cycles occur

The rule is:

> module references must resolve deterministically to one explicit module graph, or fail explicitly

This task must not introduce registry/network/path semantics beyond what is minimally required to close symbolic references.

---

## Constraint

Do **not** implement:

- remote fetching
- package registries
- version constraints
- semver
- path-based import syntax
- wildcard imports
- selective exports
- override precedence

This task is only about:

> semantic closure of symbolic module imports

---

## Scope

Given already-parsed/lowered module sources:

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

define:

```ts
type ModuleRegistry = Record<string, SurfaceModule>
```

and resolution result:

```ts
type ResolvedModuleGraph = {
  root: string
  order: string[]
  modules: Record<string, SurfaceModule>
}
```

with failure result:

```ts
type ModuleResolutionVerdict = {
  ok: boolean
  graph?: ResolvedModuleGraph
  errors: ModuleResolutionError[]
}
```

---

## Policy Decisions

### 1. Module identity is exact `moduleId`

A module is identified only by its declared:

```text
module "<module-id>"
```

No inference from:
- filename
- directory
- workspace id
- repo path

This must remain absolute.

---

### 2. Registry is explicit input

Resolution happens against an explicit in-memory registry:

```ts
Record<moduleId, SurfaceModule>
```

This task does not define how the registry is loaded from disk/network.  
It only defines resolution once the registry exists.

---

### 3. Import binding is exact lookup

An import:

```text
import "<module-id>"
```

resolves iff that exact `moduleId` exists in the registry.

No fuzzy matching.
No aliasing.
No fallback search.

---

### 4. Duplicate registry identity is illegal

If two source files claim the same `moduleId`, registry construction must fail before graph resolution.

This task may model registry as already unique, but executable tests must include duplicate-identity detection at the registry boundary.

---

### 5. Graph traversal is deterministic

For root module `R`, resolution traverses imports recursively.

Traversal order must be deterministic:

- imports processed in lexical order of imported `moduleId`
- final module order is topological if acyclic
- ties broken lexically by `moduleId`

No dependence on source insertion order.

---

### 6. Cycle handling is explicit

Cycles are illegal in v0.

If import graph contains cycle:

- resolution fails with explicit cycle error

Do not invent lazy fixpoint semantics.
Do not partially accept cyclic graphs.

---

### 7. Missing imports are explicit errors

If imported `moduleId` is absent in registry:

- resolution fails

No partial graph success.
No dangling symbolic imports.

---

### 8. Root inclusion

Resolved graph must always include the root module itself, even if it imports nothing.

---

### 9. Resolution does not compose yet

Resolution produces a lawful module graph.  
Composition remains a separate later step.

So:

```text
resolve imports → graph
compose graph modules → composed workspace
```

Do not collapse these stages.

---

### 10. Re-resolution determinism

Given same root and same registry:

```text
resolve(root, registry) -> same verdict
```

No environment dependence.

---

## Deliverables

- [ ] Create module/import resolution lawbook
- [ ] Create module/import resolution executable spec
- [ ] Implement:
  ```ts
  buildRegistry(modules): RegistryVerdict
  resolveModuleGraph(rootId, registry): ModuleResolutionVerdict
  ```
- [ ] Replace resolution-layer `todo` tests with real tests
- [ ] Keep graph construction deterministic and explicit

---

## Required Law Families

### Law family M1 — Identity laws
- module identity is exact `moduleId`
- duplicate identities are illegal

### Law family M2 — Binding laws
- imports resolve by exact lookup only
- missing imports fail

### Law family M3 — Graph laws
- graph traversal deterministic
- root included
- no partial ambiguous graph

### Law family M4 — Cycle laws
- cycles are illegal
- cycle failure is explicit

### Law family M5 — Separation laws
- resolution builds graph only
- composition remains separate stage

---

## Required Error Types

At minimum:

```ts
type ModuleResolutionError =
  | { tag: "DuplicateModuleId"; moduleId: string }
  | { tag: "MissingImport"; importer: string; missing: string }
  | { tag: "ImportCycle"; cycle: string[] }
  | { tag: "UnknownRootModule"; root: string }
```

Do not add more unless required.

---

## Test Plan

Implement tests for:

1. **registry builds successfully for unique module ids**
2. **duplicate module id fails registry construction**
3. **root module with no imports resolves to graph of size 1**
4. **single import resolves exactly**
5. **missing import fails with MissingImport**
6. **multi-module graph resolves in deterministic order**
7. **cycle A -> B -> A fails with ImportCycle**
8. **longer cycle fails with explicit cycle path**
9. **unknown root module fails**
10. **resolution does not compose or mutate modules**

---

## Acceptance Criteria

- [ ] Lawbook contains explicit module resolution rules
- [ ] Executable spec contains real tests
- [ ] All 10 tests above are implemented
- [ ] All module resolution tests pass
- [ ] Resolution is deterministic
- [ ] Import graph is now semantically closed

---

## Non-Goals

- Do not implement file-system loading
- Do not implement path imports
- Do not implement package registries
- Do not implement version solving
- Do not implement cyclic fixpoint semantics
- Do not merge resolution with composition

---

## Failure Policy

If current module surface AST is insufficient to support exact identity and deterministic graph construction:

1. do not guess
2. create:
   ```text
   .ai/tasks/20260401-025-module-import-resolution-semantics.questions.md
   ```
3. identify the exact missing invariant
4. stop at that boundary

---

## Status

🟡 **PLANNED** — 2026-04-01

---

## Rationale

You already have:

- module syntax
- explicit composition
- conservative composition

But until imports resolve lawfully, module references remain symbolic and open.

This task closes the final major symbolic reference cavity.

---

## Next Step

After completion:

- rerun parser, module-surface, composition, and scenario tests
- regenerate closure report
- then assess whether the corpus has reached terminal closure under the current PDA pass

---