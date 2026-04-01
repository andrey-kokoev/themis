# Task 031: Startup Section

**Status:** IN PROGRESS  
**Parent:** Task 030 (Direct Pane Pipes)

---

## Objective

Add explicit startup phase to workspace for orchestrating initialization after panes load.

---

## Problem

With unidirectional pipes, both processes may block waiting for input (deadlock). Need a way to "prime" the conversation.

---

## Proposed Syntax

```themis
module "two_kimi" {
  workspace "main" {
    pipe { from: left, to: right }
    pipe { from: right, to: left }

    tab "conversation" in local {
      pane left { command "kimi" }
      pane right { command "kimi" }
    }

    startup {
      send "Hello, let's collaborate." to left
      wait 1s
      # Extensible for: health checks, multi-send, etc.
    }
  }
}
```

---

## Implementation

### Parser Extension
- `startup` keyword
- `send` statement: `send <string> to <pane>`
- `wait` statement: `wait <number>s`

### Backend
- Generate after pane creation
- Use `tmux send-keys` for send
- Use `sleep` for wait

---

## Acceptance Criteria

- [ ] `startup` block parsed
- [ ] `send "message" to pane` generates tmux send-keys
- [ ] `wait Ns` generates sleep
- [ ] Commands execute after panes created
- [ ] Multiple statements in startup supported
