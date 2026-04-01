---
id: r2m8vf
title: "Canonical Rendering / Formatter Lawbook v0"
kind: lawbook
order: 28
source: populated-for-semantic-tests
---

# Canonical Rendering / Formatter Lawbook v0

## Status
Semantically populated for minimal parser subset.

## Object
This lawbook defines the canonical textual representation for ASTs produced by the minimal parser.

## Scope

### In Scope
Rendering of AST nodes from the minimal parser subset:
- Workspace
- ContextBlock, ContextEntry
- PersistenceClause, EquivalenceClause
- RoleBlock, SubjectBlock
- RealizerBlock, WitnessBlock
- RelationBlock

### Out of Scope
- Comments preservation
- Whitespace preservation from source
- Multiple formatting styles
- Extension blocks
- Imports/modules
- Multi-workspace composition

## Law Family R1 — Uniqueness

### R1.1: Single Canonical Form
For any valid AST, there exists exactly one canonical string representation.

### R1.2: Independence from Source Formatting
The canonical form must not depend on the original input's whitespace, indentation, or ordering (where reordering is permitted by other laws).

## Law Family R2 — Idempotence

### R2.1: Render-Parse-Render Stability
```
render(parse(render(parse(x)))) === render(parse(x))
```

### R2.2: Canonical Output Parseability
Parsing a canonical rendering must produce an AST that renders to the identical canonical string.

## Law Family R3 — Ordering

### R3.1: Workspace Structure
Canonical workspace order:
1. `workspace "<name>" {`
2. `context { ... }`
3. `persistence "<mode>"`
4. `equivalence "<name>"`
5. `role` blocks (sorted by role id, ascending)
6. `relation` blocks (sorted by kind, source, target tuple)
7. Closing brace `}`

### R3.2: Context Entry Ordering
Context entries sorted by key (lexicographically ascending).

### R3.3: Role Ordering
Roles sorted by roleId (string ascending).

### R3.4: Inside Role Ordering
1. `kind`
2. `subject`
3. `realizer` clauses (source order preserved)
4. `witness` clauses (source order preserved)

### R3.5: Inside Subject Ordering
1. `identity`
2. `reference`
3. `locator` (if present)

### R3.6: Relation Ordering
Relations sorted lexicographically by tuple `(kind, source, target)`.

## Law Family R4 — Stability

### R4.1: Deterministic Output
Same AST must always produce identical canonical string.

### R4.2: No Time-Based Variation
Rendering must not depend on time, randomness, or environment.

## Law Family R5 — Losslessness

### R5.1: Round-Trip Equality
For any valid input:
```
ast = parse(input)
canonical = render(ast)
ast2 = parse(canonical)
ast equals ast2
```

### R5.2: Semantic Preservation
All semantic information from the original AST must be preserved in the canonical form.

## Formatting Rules

### F1: Indentation
- 2 spaces per indentation level
- No tabs

### F2: Line Structure
- Opening brace on same line as header
- Closing brace on its own line at parent's indentation
- One item per line for multi-item blocks

### F3: Spacing
- Single space after keywords
- Single space between string arguments
- No trailing spaces

### F4: Blank Lines
Blank line between major workspace sections:
- After context block
- After equivalence clause
- Between role blocks
- Before relations (if relations exist)

### F5: String Formatting
- Preserve exact string contents
- Always use double quotes
- No escaping unless necessary

## Error Classes

| Class | Description |
|-------|-------------|
| `InvalidAST` | AST node is not from the supported subset |
| `MissingRequiredField` | AST node missing field required for rendering |

## Closure Criterion

This rendering object is locally closed when:
- all R1-R5 laws are explicitly defined (✓ above)
- render implementation produces deterministic output
- round-trip tests pass for all valid inputs
- no formatting ambiguity remains
