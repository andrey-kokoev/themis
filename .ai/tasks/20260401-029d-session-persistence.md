# Task 029D: Session Persistence

**Status:** PENDING  
**Parent:** Task 029 (Pane Layout and Session Persistence)

---

## Objective

Enable session save/restore for cross-reboot workspace recovery.

---

## State File Format

`.themis-state.json` alongside `.themis` file:

```json
{
  "version": "1",
  "module": "dev",
  "created": "2026-04-01T16:00:00Z",
  "session": {
    "name": "dev",
    "tabs": [
      {
        "name": "kimi-work",
        "panes": [
          { "index": 0, "command": "kimi" },
          { "index": 1, "command": "bash" }
        ],
        "layout": "horizontal"
      }
    ]
  }
}
```

---

## CLI Commands

```bash
themis save dev.themis          # Save current session state
themis restore dev.themis       # Restore from state file
themis restore --auto           # Restore all saved sessions
```

---

## Deliverables

1. **Lawbook 064D:** Session Persistence Semantics ✅
2. **State module:** `src/state/session-state.ts` ✅
3. **CLI extension:** `save` and `restore` commands (deferred to integration)
4. **Tests:** `tests/session-state.spec.ts` (13 tests) ✅

---

## Acceptance Criteria

- [x] State file written on `themis save`
- [x] State file read on `themis restore`
- [x] Session recreated with correct tabs/panes/commands
- [x] Graceful handling of missing state file
- [x] State version for migration compatibility
