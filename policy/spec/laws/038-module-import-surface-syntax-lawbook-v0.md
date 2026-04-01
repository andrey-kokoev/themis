---
id: "038"
title: "Module / Import Surface Syntax Lawbook v0"
kind: lawbook
order: 38
dependencies: ["036"]
---

# Module / Import Surface Syntax Lawbook v0

## Overview

This lawbook defines the minimal surface syntax for module composition in Themis.

---

## Law Family M1: Module Root Laws

### M1.1 — Single module root
A source file contains exactly one `module` root.

**Must**: Parser rejects files with zero modules.
**Must**: Parser rejects files with two or more modules.

### M1.2 — Explicit module id
Module id is author-declared in syntax, not inferred.

```text
module "<module-id>" { ... }
```

**Must**: Module id is a non-empty quoted string.
**Must not**: Module id be inferred from file name, directory, or repo path.

### M1.3 — Workspace inside module
A module contains exactly one workspace.

```text
module "<module-id>" {
  workspace "<workspace-id>" { ... }
}
```

**Must**: Parser reject module without workspace.
**Must**: Parser reject module with multiple workspaces.

---

## Law Family M2: Import Laws

### M2.1 — Symbolic imports only
Imports are symbolic identifiers, not paths.

```text
import "<module-id>"
```

**Must**: Import declaration introduces symbolic dependency edge.
**Must not**: Import resolve paths, packages, or versions in v0.

### M2.2 — Import placement
Imports appear at module top level, before workspace.

**Must**: Parser reject import inside workspace.
**Must**: Parser reject import after workspace.

---

## Law Family M3: Explicit Composition Declaration Laws

### M3.1 — Namespace declaration

```text
namespace "<module-id>" as "<namespace>"
```

**Must**: Lower to `NamespaceDecl { moduleId, namespace }`.
**Must not**: Introduce new namespace semantics.

### M3.2 — Role alias declaration

```text
alias role "<module-id>".<"local-role-id"> as "<composed-role-id>"
```

**Must**: Lower to `RoleAliasDecl { moduleId, localRoleId, composedRoleId }`.
**Must not**: Introduce new alias semantics.

### M3.3 — Shared identity declaration

```text
share subject "<subject-id>" across "<module-a>", "<module-b>"
```

**Must**: Lower to `SharedIdentityDecl { subjectId, modules }`.
**Must not**: Introduce new shared identity semantics.

---

## Law Family M4: Placement Laws

### M4.1 — Composition declarations at top level
Namespace, alias, and shared identity declarations appear at module top level.

**Must**: Parser reject these declarations inside workspace.

### M4.2 — Workspace grammar unchanged
Inside workspace, existing parser subset applies unchanged.

**Must not**: Extend workspace-internal grammar in this task.

---

## Law Family M5: Lowering Laws

### M5.1 — Deterministic lowering
Parsed module lowers deterministically to:
- One `ModuleRef`
- One partial `ExplicitCompositionPolicy`
- One list of imported module ids

### M5.2 — Canonical surface order
Canonical order inside module:
1. imports
2. namespace declarations
3. alias declarations
4. shared identity declarations
5. workspace

**Must**: Renderer output follow canonical order.
