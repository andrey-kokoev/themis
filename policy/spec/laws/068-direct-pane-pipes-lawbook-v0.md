---
id: 068-direct-pane-pipes-lawbook-v0
title: "Direct Pane Pipes Lawbook"
kind: lawbook
order: 68
---

# Direct Pane Pipes Lawbook

Defines bidirectional pipe semantics between two panes.

---

## P1: Declaration Laws

### P1.1: Syntax
```
PipeDecl ::= "pipe" "{" "between" ":" "[" PaneRef "," PaneRef "]" "}"
PaneRef  ::= identifier
```

### P1.2: Exactly Two Panes
A pipe MUST connect exactly two distinct panes.

### P1.3: Pane Existence
Referenced panes MUST exist in the workspace.

---

## P2: FIFO Creation Laws

### P2.1: Two FIFOs Created
For pipe `{ between: [A, B] }`, Themis SHALL create:
- `A_to_B`: A writes, B reads
- `B_to_A`: B writes, A reads

### P2.2: Location
FIFOs SHALL be created in `/tmp/themis/<module_id>/`.

### P2.3: Naming
Format: `<paneA>_to_<paneB>`

---

## P3: Connection Laws

### P3.1: Stdout Redirection
Pane A's stdout SHALL be redirected to `A_to_B` FIFO.

### P3.2: Stdin Redirection  
Pane A's stdin SHALL be redirected from `B_to_A` FIFO.

### P3.3: Symmetry
Connection SHALL be symmetric: A→B and B→A.

---

## P4: Execution Laws

### P4.1: FIFO Creation Order
FIFOs SHALL be created BEFORE pane processes start.

### P4.2: Open Mode
FIFOs SHALL be opened read-write or with O_NONBLOCK to prevent deadlock.

### P4.3: Cleanup
FIFOs SHALL be removed when session ends.
