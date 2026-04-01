---
id: 058-cli-operational-semantics-lawbook-v0
title: "CLI Operational Semantics Lawbook"
kind: lawbook
order: 58
---

# CLI Operational Semantics Lawbook

Defines the operational semantics for the Themis CLI tool.

---

## C1: Invocation Laws

### C1.1: File Argument Required
The CLI MUST require exactly one file argument pointing to a `.themis` module.

**Violations:**
- Zero arguments → error with usage
- Multiple file arguments → error with usage
- Non-existent file → error "file not found"

### C1.2: Backend Selection
The CLI MUST support `--backend=<name>` flag with values:
- `tmux` (default): Use tmux backend
- `wt`: Use Windows Terminal backend

Unknown backend → error "unknown backend"

### C1.3: Dry-Run Mode
With `--dry-run`, the CLI MUST print commands without executing.

---

## C2: Pipeline Laws

### C2.1: Execution Pipeline
For valid invocation, the CLI MUST execute:
1. **Parse**: Read file → parse → Module AST
2. **Validate**: Check well-formedness
3. **Plan**: Runtime planning → Integrations
4. **Route**: Backend routing decision
5. **Realize**: Backend plan generation
6. **Build**: Convert plan to shell commands
7. **Execute**: Run commands (unless dry-run)

### C2.2: Error Propagation
Each stage failure MUST:
- Print error to stderr
- Exit with non-zero code
- Not proceed to subsequent stages

### C2.3: Success Output
On success with `--verbose`, print pipeline summary.

---

## C3: Tmux Command Builder Laws

### C3.1: Session Creation
For new workspace, generate:
```
tmux new-session -d -s <workspace-name> -n <first-tab-name>
```

### C3.2: Window Creation
For each additional tab:
```
tmux new-window -t <session-name> -n <tab-name>
```

### C3.3: Command Execution
For tab with command:
```
tmux send-keys -t <session-name>:<tab-name> '<command>' C-m
```

### C3.4: Attachment
Finally:
```
tmux attach -t <session-name>
```

---

## C4: Safety Laws

### C4.1: Session Exists Check
If session already exists, error with message to use `tmux attach` or choose different name.

### C4.2: Command Injection Prevention
All user commands MUST be properly escaped/quoted before sending to tmux.

### C4.3: Exit Code Preservation
CLI exit code MUST reflect success/failure of pipeline.
