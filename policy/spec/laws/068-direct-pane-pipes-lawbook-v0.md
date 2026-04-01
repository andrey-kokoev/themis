---
id: 068-direct-pane-pipes-lawbook-v0
title: "Direct Pane Pipes Lawbook"
kind: lawbook
order: 68
---

# Direct Pane Pipes Lawbook

Defines unidirectional pipe semantics between two panes.

---

## P1: Declaration Laws

### P1.1: Syntax
```
PipeDecl ::= "pipe" "{" "from" ":" PaneRef "," "to" ":" PaneRef "}"
PaneRef  ::= identifier
```

### P1.2: Unidirectional
A pipe SHALL carry data in one direction only: `from` → `to`.

### P1.3: Pane Existence
Referenced panes MUST exist in the workspace.

### P1.4: Bidirectional Pairs
To achieve bidirectional communication, declare TWO pipes:
```
pipe { from: A, to: B }
pipe { from: B, to: A }
```

---

## P2: FIFO Creation Laws

### P2.1: One FIFO per Pipe
For pipe `{ from: A, to: B }`, Themis SHALL create:
- `A_to_B`: A writes, B reads

### P2.2: Location
FIFOs SHALL be created in `/tmp/themis/<module_id>/`.

### P2.3: Naming
Format: `<from>_to_<to>`

---

## P3: Connection Laws

### P3.1: Stdout Redirection
`from` pane's stdout SHALL be redirected to the FIFO.

### P3.2: Stdin Redirection
`to` pane's stdin SHALL be redirected from the FIFO.

### P3.3: Ownership
`from` owns write end. `to` owns read end. Like Rust ownership.

---

## P4: Execution Laws

### P4.1: FIFO Creation Order
FIFOs SHALL be created BEFORE pane processes start.

### P4.2: Open Mode
FIFOs SHALL be opened read-write or with O_NONBLOCK to prevent deadlock.

### P4.3: Cleanup
FIFOs SHALL be removed when session ends.
