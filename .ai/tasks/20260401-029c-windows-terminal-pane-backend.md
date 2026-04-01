# Task 029C: Windows Terminal Pane Backend

**Status:** PENDING  
**Parent:** Task 029 (Pane Layout and Session Persistence)

---

## Objective

Extend Windows Terminal backend to generate pane split commands.

---

## WT Commands

```bash
# Create tab with first pane
wt.exe new-tab --title <name> -- ...

# Split horizontally
wt.exe ... ; split-pane --horizontal -- ...

# Split vertically  
wt.exe ... ; split-pane --vertical -- ...
```

---

## Mapping

| Themis DSL | WT Command |
|------------|------------|
| `pane horizontal {}` | `split-pane --horizontal` |
| `pane vertical {}` | `split-pane --vertical` |
| Tab-level layout | Initial split direction |

---

## Deliverables

1. **Lawbook 064C:** Windows Terminal Pane Execution Semantics ✅
2. **Backend extension:** `src/backend/wt-pane-builder.ts` ✅
3. **Tests:** `tests/wt-pane-backend.spec.ts` (8 tests) ✅

---

## Acceptance Criteria

- [x] `split-pane --horizontal` for horizontal layout
- [x] `split-pane --vertical` for vertical layout
- [x] Multiple splits within single tab
- [x] Commands sent to correct panes
