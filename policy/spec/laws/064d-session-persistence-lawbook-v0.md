---
id: 064d-session-persistence-lawbook-v0
title: "Session Persistence Lawbook"
kind: lawbook
order: 67
---

# Session Persistence Lawbook

Defines semantics for session save and restore operations.

---

## P1: State File Laws

### P1.1: Location
State file SHALL be named `<module>.themis-state.json` alongside `.themis` file.

### P1.2: Format
JSON format with schema version for migration compatibility.

### P1.3: Content
State SHALL capture:
- Module identifier
- Session name
- Tabs (name, layout)
- Panes (index, command)
- Creation timestamp

---

## P2: Save Operation Laws

### P2.1: Trigger
`themis save <file.themis>` SHALL write state file.

### P2.2: Active Session Detection
If session currently running, capture ACTUAL state from tmux/WT.
If session not running, capture DECLARED state from `.themis` file.

### P2.3: Atomic Write
State SHALL be written atomically (temp file + rename).

---

## P3: Restore Operation Laws

### P3.1: Trigger
`themis restore <file.themis>` SHALL read state file and recreate session.

### P3.2: Missing State
If state file absent, SHALL error with message to use `themis <file>` instead.

### P3.3: Session Existence
If session already exists, SHALL error (prevent overwrite) or prompt for replace.

### P3.4: Command Replay
Restore SHALL re-run commands from state file, not from current `.themis`.

---

## P4: State Schema (v1)

```json
{
  "version": "1",
  "module": "string",
  "created": "ISO8601",
  "source": " declared | runtime",
  "session": {
    "name": "string",
    "backend": "tmux | wt",
    "tabs": [{
      "name": "string",
      "layout": "horizontal | vertical",
      "panes": [{
        "index": number,
        "command": "string | null"
      }]
    }]
  }
}
```

---

## P5: Cross-Version Laws

### P5.1: Forward Compatibility
Newer Themis SHALL read older state versions and migrate on load.

### P5.2: Unknown Version
Unknown state version SHALL error with clear message.
