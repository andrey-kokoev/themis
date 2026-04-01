# Task 029B: Tmux Pane Backend

**Status:** PENDING  
**Parent:** Task 029 (Pane Layout and Session Persistence)

---

## Objective

Extend tmux backend to generate pane split commands.

---

## Tmux Commands

```bash
# Create window with first pane
tmux new-session -d -s <session> -n <window>

# Split horizontally (panes side-by-side)
tmux split-window -h -t <window>

# Split vertically (panes stacked)
tmux split-window -v -t <window>

# Send commands to specific panes
tmux send-keys -t <window>.<pane-index> '<command>' C-m
```

---

## Mapping

| Themis DSL | Tmux Command |
|------------|--------------|
| `pane horizontal {}` | `split-window -h` |
| `pane vertical {}` | `split-window -v` |
| First pane | Implicit in new-window |
| Layout at tab level | Sequence of splits |

---

## Deliverables

1. **Lawbook 064B:** Tmux Pane Execution Semantics ✅
2. **Backend extension:** `src/backend/tmux-pane-builder.ts` ✅
3. **Tests:** `tests/tmux-pane-backend.spec.ts` (8 tests) ✅

---

## Acceptance Criteria

- [x] 2-pane horizontal layout generates `-h` split
- [x] 2-pane vertical layout generates `-v` split
- [x] Commands sent to correct pane indices
- [x] Pane order preserved from DSL definition
