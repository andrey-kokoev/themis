# Task 030: Direct Pane-to-Pane Pipes

**Status:** IN PROGRESS  
**Parent:** Task 029 (Pane Layout and Session Persistence)

---

## Objective

Enable direct bidirectional communication between two panes without mediator.

---

## Use Case

Two kimi instances speaking directly to each other:
```
kimi (pane left)  ⟷  kimi (pane right)
```

Whatever left outputs, right receives. Whatever right outputs, left receives.

---

## Proposed Syntax

```themis
module "two_kimi" {
  workspace "main" {
    // Bidirectional pipe between two panes
    pipe { between: [left, right] }

    tab "conversation" in local {
      pane left { command "kimi" }
      pane right { command "kimi" }
    }
  }
}
```

---

## Implementation

Themis creates two FIFOs:
- `left_to_right`: left writes → right reads
- `right_to_left`: right writes → left reads

Pane commands:
```bash
# left pane
kimi > /tmp/themis/two_kimi/left_to_right < /tmp/themis/two_kimi/right_to_left

# right pane  
kimi > /tmp/themis/two_kimi/right_to_left < /tmp/themis/two_kimi/left_to_right
```

---

## Acceptance Criteria

- [ ] `pipe { between: [paneA, paneB] }` syntax
- [ ] Bidirectional FIFOs created automatically
- [ ] Pane stdout connected to FIFO
- [ ] Pane stdin connected from FIFO
- [ ] Works with any command (not just kimi)

---

## Notes

- Deadlock risk if both processes wait for input before output
- May need `stdbuf -o0` for unbuffered output
- Simplest possible IPC: just two processes talking
