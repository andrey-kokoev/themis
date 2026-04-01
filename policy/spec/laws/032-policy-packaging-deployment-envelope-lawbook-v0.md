---
id: k4t8pv
title: "Policy Packaging / Deployment Envelope Lawbook v0"
kind: lawbook
order: 32
source: populated-for-semantic-tests
---

# Policy Packaging / Deployment Envelope Lawbook v0

## Status
Semantically populated for deployment envelope validation.

## Object
This lawbook defines repository structure boundaries and artifact classification for enforceable pipeline semantics.

## Scope

### In Scope
- Directory authority classification
- Pipeline stage read/write rules
- Reproducibility requirements
- State isolation

### Out of Scope
- CI/CD integration
- Packaging formats
- Containerization
- Cloud deployment
- File watchers

## Law Family D1 — Authority

### D1.1: Directory Classification
| directory | authority | rule |
|-----------|-----------|------|
| /policy/src | authoritative | must not be generated |
| /policy/spec | authoritative | must not be generated |
| /policy/generated | non-authoritative | must be reproducible |
| /policy/dist | non-authoritative | must be reproducible |
| /policy/state | non-authoritative | runtime-only |
| /policy/cache | non-authoritative | disposable |

### D1.2: Cross-Boundary Write Prevention
No process may write to `/src` or `/spec` during pipeline execution.

## Law Family D2 — Pipeline Correctness

### D2.1: Pipeline Stages
Pipeline: `parse → lower → validate → normalize → render → integrate → journal`

### D2.2: Stage Read/Write Rules
| stage | reads | writes |
|-------|-------|--------|
| parse/lower/validate/normalize | /src, /spec | in-memory |
| render | AST | /generated |
| integrate | workspace + facts | in-memory |
| journal | verdict | /state |

### D2.3: Prohibited Operations
No stage may write to `/src` or `/spec`, or read from `/state` as source.

## Law Family D3 — Reproducibility

### D3.1: Generated Artifact Rule
Everything in `/generated` and `/dist` must be reproducible from `/src + /spec`.

### D3.2: Violation Detection
Non-reproducible artifacts in `/generated` or `/dist` are violations.

## Law Family D4 — Isolation

### D4.1: State Isolation
`/state` must not influence parsing, rendering, composition, or integration logic.

### D4.2: Cache Disposability
Deleting `/cache` must not change authoritative results or generated output correctness.

## Law Family D5 — Coupling

### D5.1: No Cross-Import Rule
No code may import from `/generated` into `/src`, or from `/state` into semantic layers.

## Conflict Types

| Violation | Description |
|-----------|-------------|
| `IllegalWriteToSource` | Write to /src or /spec detected |
| `NonReproducibleArtifact` | /generated or /dist not derivable from source |
| `StateUsedAsSource` | /state used as input to semantic layers |
| `IllegalCrossImport` | Import from /generated into /src |
| `CacheAffectsSemantics` | Cache deletion changes authoritative result |

## Closure Criterion

This deployment envelope object is locally closed when:
- all D1-D5 laws are explicitly defined (✓ above)
- `validateRepo(rootPath)` is implemented
- violations are detectable deterministically
