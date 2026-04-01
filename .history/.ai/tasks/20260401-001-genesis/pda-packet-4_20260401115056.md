=== FILE: /policy/spec/notes/INDEX.md ===
# PDA Corpus Index v0

This index enumerates the current PDA descent corpus, ordered by object stabilization sequence.

## Laws

001-kernel-lawbook.md
002-dsl-bridge-lawbook.md
003-parser-lawbook.md
004-runtime-planning-lawbook.md
005-runtime-reconciliation-lawbook.md
006-runtime-persistence-lawbook.md
007-runtime-integration-lawbook.md
008-substrate-adapter-lawbook.md
009-terminal-session-lawbook.md
010-tmux-profile-lawbook.md
011-wt-wsl-profile-lawbook.md
012-wt-wsl-policy-lawbook.md
013-migration-lawbook.md
014-render-lawbook.md
015-composition-lawbook.md
016-explicit-composition-lawbook.md
017-envelope-lawbook.md
018-journal-lawbook.md

## Executable Specs

parser-executable-spec.md
runtime-integration-executable-spec.md
explicit-composition-executable-spec.md
journal-executable-spec.md

## Notes

CLOSURE.md
GRAPH.md

## Invariant

Ordering is semantic, not incidental.  
Do not reorder without revisiting dependency graph.

=== END FILE ===


=== FILE: /policy/spec/notes/CLOSURE.md ===
# PDA Closure Status v0

## Definition

An object is locally closed if:

- its admissible inputs are bounded
- its outputs are uniquely determined
- no internal rule requires further descent to eliminate arbitrariness

## Locally Closed Objects

### Core Semantic Spine
- kernel
- DSL bridge
- parser
- runtime planning
- runtime reconciliation
- persistence interpretation
- runtime-to-context integration

### Substrate Layer
- adapter semantics
- terminal-session semantics
- tmux profile
- WT+WSL profile
- WT+WSL policy

### Composition Layer
- conservative composition
- explicit namespacing / shared identity composition

### Representation Layer
- canonical rendering
- normalization projection

### Envelope Layer
- deployment envelope
- source/generated/state/cache boundaries

### Operational Layer
- durable runtime journal

### Materialization Layer
- policy/source tree scaffold

## Not Closed (Outer Objects)

These remain valid PDA descent targets:

- concrete backend execution semantics (tmux commands, process lifecycle)
- operator intervention protocol (authority, reversibility, replay)
- policy versioning and migration across schema changes
- DSL import / module surface syntax
- repository validator / scaffold enforcement tooling

## Status Statement

This corpus represents:

> a locally terminal core stack with non-terminal outer envelope

## Working Rule

Stop blind descent.  
Proceed only via explicit object selection.

=== END FILE ===


=== FILE: /policy/spec/notes/GRAPH.md ===
# PDA Dependency Graph v0

## Direction

Edges point from prerequisite → dependent.

## Graph

kernel
  → dsl-bridge
  → context

dsl-bridge
  → parser

parser
  → runtime-planning

runtime-planning
  → runtime-reconciliation

runtime-reconciliation
  → runtime-persistence
  → runtime-integration

runtime-persistence
  → runtime-integration

runtime-integration
  → kernel (satisfaction)

kernel
  → render

render
  → composition

composition
  → explicit-composition

explicit-composition
  → envelope

envelope
  → journal

journal
  → scaffold

scaffold
  → repository materialization

## Cycles

Allowed only at:
- runtime-integration → kernel (evaluation loop)

All other layers are acyclic.

## Interpretation

Graph encodes descent order and stabilization dependencies.  
Reordering requires justification at PDA level.

=== END FILE ===


=== FILE: /policy/README.md ===
# PDA Policy Corpus

## What this is

A structured corpus of PDA-derived lawbooks, executable specs, and notes.

This repository separates:

- source semantics
- executable specifications
- generated artifacts
- runtime state

## Authoritative Source

- /policy/src
- /policy/spec

These must be versioned and backed up.

## Non-Authoritative

- /policy/generated
- /policy/dist
- /policy/state
- /policy/cache

These are reproducible or runtime-only.

## Pipeline

1. parse (DSL → AST)
2. desugar (surface → explicit)
3. lower (explicit → kernel)
4. validate (well-formedness)
5. normalize
6. render (canonical)
7. evaluate (kernel satisfaction)
8. runtime (planning → reconciliation → persistence → integration)
9. compose (conservative → explicit)
10. envelope (packaging)
11. journal (runtime history)

## Tests

Located in:

/policy/spec/tests

Run via:

pnpm test

## Rendering

Canonical renders:

pnpm render:canonical

## Reports

Law coverage and semantic review:

pnpm report:laws

## Closure

See:

/policy/spec/notes/CLOSURE.md

## Principle

Source is declarative.  
Runtime is observational.  
Generated is disposable.

=== END FILE ===


=== FILE: /policy/.gitignore ===
# generated artifacts
/policy/generated/
/policy/dist/

# runtime state
/policy/state/

# cache
/policy/cache/

# node
node_modules/

# temp
*.log
*.tmp

=== END FILE ===