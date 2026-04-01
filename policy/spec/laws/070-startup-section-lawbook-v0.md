---
id: 070-startup-section-lawbook-v0
title: "Startup Section Lawbook"
kind: lawbook
order: 70
---

# Startup Section Lawbook

Defines startup phase for workspace initialization.

---

## S1: Declaration Laws

### S1.1: Syntax
```
StartupBlock ::= "startup" "{" StartupStmt* "}"
StartupStmt    ::= SendStmt | WaitStmt
SendStmt       ::= "send" String "to" PaneRef
WaitStmt       ::= "wait" Number "s"
PaneRef        ::= identifier
```

### S1.2: Optional
Startup block is OPTIONAL. If absent, no initialization occurs.

### S1.3: Execution Order
Startup statements execute SEQUENTIALLY after all panes are created.

---

## S2: Send Statement Laws

### S2.1: Target Validity
Target pane MUST exist in workspace.

### S2.2: Message Delivery
Message SHALL be delivered via `tmux send-keys` to target pane.

### S2.3: Newline
Message SHALL include trailing newline (C-m).

---

## S3: Wait Statement Laws

### S3.1: Unit
Number specifies seconds.

### S3.2: Precision
Wait SHALL be at least specified duration (may be longer due to scheduling).

---

## S4: Execution Laws

### S4.1: Timing
Startup executes AFTER all panes/windows created, BEFORE attach.

### S4.2: Blocking
Each statement blocks until complete.
