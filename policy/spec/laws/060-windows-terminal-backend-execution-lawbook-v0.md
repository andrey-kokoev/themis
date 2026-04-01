---
id: 060-windows-terminal-backend-execution-lawbook-v0
title: "Windows Terminal Backend Execution Lawbook"
kind: lawbook
order: 62
---

# Windows Terminal Backend Execution Lawbook

Defines the execution semantics for Windows Terminal backend.

---

## W1: Command Structure Laws

### W1.1: Tab Creation
Each role SHALL map to a `new-tab` command with:
- `--title <role-id>` for tab naming
- `--profile Ubuntu` (or configured profile)
- `--startingDirectory <path>` for working directory
- Command to execute via WSL

### W1.2: Single Invocation
All tabs SHALL be created in a single `wt.exe` invocation using semicolon separators.

### W1.3: WSL Bridge
Commands SHALL execute through WSL bridge:
```
wt.exe ... -- wsl.exe -d Ubuntu -e <command>
```

---

## W2: Path Translation Laws

### W2.1: WSL Path Conversion
Unix paths SHALL convert to Windows WSL UNC format:
- `/home/andrey/project` → `\\wsl$\Ubuntu\home\andrey\project`

### W2.2: Starting Directory
The working directory SHALL be set to the module file's directory.

---

## W3: Execution Model Laws

### W3.1: Fire and Forget
WT execution SHALL be non-blocking. The CLI exits immediately after spawning WT.

### W3.2: No Session Persistence
WT SHALL NOT provide session re-attachment (unlike tmux).

### W3.3: Error Handling
If WT executable not found, SHALL report clear error message.
