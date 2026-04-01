---
id: graph-v0
title: "PDA Dependency Graph v0"
kind: note
order: 61
---


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
