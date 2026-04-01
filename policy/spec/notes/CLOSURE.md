---
id: closure-v0
title: "PDA Closure Status v0"
kind: note
order: 38
---


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
