# Questions for Task 20260401-005: Executable Spec Semantic Implementation

## Blocking Issue 1: Lawbooks Are Skeletal Templates Without Semantic Content

**Observation**: All examined lawbooks follow the same template structure but lack actual semantic rules:

- 001-minimal-concrete-grammar-lawbook-v0.md
- 002-minimal-parser-contract-v0.md  
- 003-minimal-ebnf-peg-style-grammar-v0.md
- 007-runtime-realization-semantics-lawbook-v0.md
- (and presumably all others)

Each contains:
- Object definition (header)
- Core intent (bullet list of generic goals)
- "What it fixes" (generic statement)
- Minimal structure (numbered list of section types)
- Closure criterion (generic statement)

**Missing**: Actual law families, rules, invariants, or behaviors that can be operationalized into tests.

**Question**: Should I:
- **A)** Stop - the lawbooks need to be populated with actual rules first (different task)
- **B)** Infer minimal semantics from the titles and generic structure (violates non-invention rule)
- **C)** Create structural tests only ("file exists", "has sections") - but these aren't semantic
- **D)** Something else?

---

## Blocking Issue 2: Missing "Kernel" Object

**Observation**: The task priority order starts with:
1. **kernel**
2. **parser**
3. **runtime integration**
...

**Current corpus**:
- No `kernel-lawbook-v0.md` exists
- No `kernel-executable-spec-v0.md` (or similar) exists
- Orders 1-3 are grammar/parser related, but no explicit "kernel"

**Question**: Where is the kernel lawbook/executable spec? Should I:
- **A)** Skip kernel and start with parser (order 1-3 exist)
- **B)** Create kernel files as part of this task (out of scope?)
- **C)** Reinterpret one of the existing lawbooks as "kernel"
- **D)** Stop and request kernel be added first

---

## Blocking Issue 3: Filename Mismatch Between Task and Corpus

**Task expects**: `kernel.spec.ts`, `parser.spec.ts`, `runtime-integration.spec.ts`, etc.

**Actual files**: `004-smallest-executable-parser-sketch-v0.spec.ts`, `009-runtime-planning-executable-spec-v0.spec.ts`, etc.

**Question**: Should I:
- **A)** Create new `.spec.ts` files with the names the task expects
- **B)** Work with existing numbered filenames
- **C)** Rename existing files to match task expectations

---

## Blocking Issue 4: What "Real Tests" Can Be Implemented

Given the lawbooks are skeletal, concrete test implementation would require:

1. **For parser**: Testing actual parse behavior - but no grammar rules defined
2. **For runtime integration**: Testing fact aggregation - but no runtime semantics defined
3. **For rendering**: Testing deterministic ordering - but no render rules defined

**Question**: What constitutes a valid "real test" given:
- The lawbooks define object boundaries but not behaviors
- "Expected contents" sections describe what should exist, not what does exist
- The non-invention rule prohibits inferring missing semantics

---

## Summary

The corpus currently contains:
- ✅ Structural scaffolding (directories, front matter, file naming)
- ✅ Placeholder test wrappers (from task 002)
- ❌ Semantic content in lawbooks (no actual rules to enforce)
- ❌ Some objects referenced in task priority (kernel)

**Recommendation**: Task 005 should be blocked pending:
1. Population of lawbooks with actual semantic rules
2. Clarification of kernel object location
3. Reconciliation of filename conventions

Or: Scope reduction to only implement structural/validity tests (file integrity, cross-references exist, etc.) rather than semantic behavior tests.
