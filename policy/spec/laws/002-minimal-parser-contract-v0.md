---
id: q8f2mw
title: "Minimal Parser Contract v0"
kind: lawbook
order: 2
source: populated-for-semantic-tests
---

# Minimal Parser Contract v0

## Status
Semantically populated for minimal parser subset.

## Object
This lawbook defines the operational contract for the minimal parser that accepts a tiny closed subset of the Themis DSL.

## Scope

### In Scope
A single workspace form with:
- context block
- persistence clause
- equivalence clause
- role blocks (with subject, realizer, witness)
- relation blocks

### Out of Scope
- extension blocks
- inline relation sugar
- witness sugar variants
- namespacing/imports
- multi-workspace composition
- comments/trivia preservation
- recovery parsing

## Law Family P1 — Root Laws

### P1.1: Single Root
A valid parse input must contain exactly one `workspace` root form.

### P1.2: No Trailing Content
After the closing brace of the workspace, only whitespace and EOF are permitted. Any other token constitutes trailing root content and is an error.

### P1.3: Workspace Header Required
The workspace form must begin with the keyword `workspace` followed by a string literal name and an opening brace.

## Law Family P2 — Block Structure Laws

### P2.1: Context Block Location
The `context` block may only appear at workspace level, directly inside the workspace braces.

### P2.2: Subject Block Location
The `subject` block may only appear inside a `role` block.

### P2.3: Realizer and Witness Location
`realizer` and `witness` clauses may only appear inside a `role` block.

### P2.4: Relation Block Location
`relation` declarations may only appear at workspace level.

### P2.5: No Deep Nesting
Beyond the workspace→role→subject nesting, no further block nesting is permitted in this subset.

## Law Family P3 — Required Clause Laws

### P3.1: Workspace Requirements
A valid workspace must contain:
- exactly one `context` block
- exactly one `persistence` clause
- exactly one `equivalence` clause
- at least one `role` block

### P3.2: Role Requirements
A valid role must contain:
- exactly one `kind` clause
- exactly one `subject` block containing:
  - exactly one `identity` clause
  - exactly one `reference` clause
- at least one `realizer` clause
- at least one `witness` clause

### P3.3: Optional Locator
The `subject` block may optionally contain a `locator` clause.

## Law Family P4 — Determinism Laws

### P4.1: Parse Uniqueness
For any valid input, the parser must produce exactly one AST. No ambiguity is permitted.

### P4.2: Error Uniqueness
For any invalid input, the parser must produce exactly one error class. The specific error may include position information, but the error class must be deterministic.

### P4.3: No Heuristic Variation
The parser must not apply heuristics that could vary between runs or implementations.

## Law Family P5 — Delimiter and EOF Laws

### P5.1: Brace Dominance
Curly braces `{}` strictly define block boundaries. All block content must be properly nested within matching braces.

### P5.2: EOF Enforcement
The parser must consume the entire input. A parse that reaches EOF without completing the workspace structure is an error.

### P5.3: Missing Close Detection
Unclosed blocks (missing closing brace) must be detected and reported as errors.

## Error Classes

The parser must use these error classes:

| Class | Description |
|-------|-------------|
| `UnexpectedToken` | Token encountered does not match expected grammar |
| `UnexpectedEOF` | End of file reached before parse complete |
| `MissingRequiredClause` | Required clause or block is absent |
| `InvalidNesting` | Block or clause appears in wrong location |
| `TrailingRootContent` | Content after workspace close |

## Closure Criterion

This parser object is locally closed when:
- all P1-P5 laws are explicitly defined (✓ above)
- parser implementation enforces all laws
- test suite verifies each law with passing tests
- no semantics outside the scoped subset are required
