---
id: 064a-pane-layout-surface-syntax-lawbook-v0
title: "Pane Layout Surface Syntax Lawbook"
kind: lawbook
order: 64
---

# Pane Layout Surface Syntax Lawbook

Defines surface syntax for pane definitions and layout specifications.

---

## S1: Tab Extension Laws

### S1.1: Pane Container
A `tab` block MAY contain one or more `pane` blocks.

```
tab "name" in local {
  pane { ... }
  pane { ... }
}
```

### S1.2: Single Pane Default
A `tab` with zero `pane` blocks is equivalent to a single implicit pane.

### S1.3: Pane Order
Panes SHALL be created in declaration order (left-to-right, top-to-bottom).

---

## S2: Pane Block Laws

### S2.1: Pane Syntax
```
PaneBlock ::= "pane" PaneLayout? "{" CommandClause? "}"
```

### S2.2: Pane Layout Modifier
Optional layout modifier specifies split direction relative to PREVIOUS pane:
- `pane horizontal` - split horizontally (side-by-side)
- `pane vertical` - split vertically (stacked)
- Absent - inherit from tab layout or default horizontal

### S2.3: Pane Command
Optional `command` clause specifies command to run in pane.

---

## S3: Tab Layout Laws

### S3.1: Tab Layout Syntax
```
TabBlock ::= "tab" String "in" TargetRef LayoutClause? "{" PaneBlock+ "}"
LayoutClause ::= "layout" LayoutKind
LayoutKind ::= "horizontal" | "vertical"
```

### S3.2: Default Layout
Tab-level layout defaults to `horizontal` when unspecified.

### S3.3: Layout Inheritance
Pane without explicit layout inherits from tab-level layout.

---

## S4: Validation Laws

### S4.1: Minimum Panes
A tab MUST contain at least one pane (explicit or implicit).

### S4.2: Layout Consistency
Nested layouts (pane layout differing from tab layout) SHALL be accepted.

### S4.3: Command Optional
Panes without commands SHALL create empty shells.
