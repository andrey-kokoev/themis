# Task 027: CLI and Operational Deployment

**Status:** IN PROGRESS  
**Started:** 2026-04-01  
**Target:** Enable actual usage of Themis with Windows Terminal

---

## Objective

Transform the terminal corpus into an operational tool that can:
1. Parse `.themis` module files from disk
2. Generate real `tmux` commands (primary) and `wt.exe` commands (secondary)
3. Execute them to create/manage terminal sessions
4. Provide a usable CLI interface

---

## User Intent State

**Target:** Try out Themis with tmux (primary) and Windows Terminal (secondary)

**Current Gap:** 
- No CLI entry point exists
- No file I/O for `.themis` modules
- Backend generates abstract plans, not executable commands
- No integration between parser → runtime → backend → execution

**Decision:** Tmux-first deployment (native WSL), WT-second (requires path translation)

---

## Acceptance Criteria

### Phase 1: Tmux (Primary) ✅
- [x] CLI command: `themis <file.themis>` parses and executes via tmux
- [x] Generates actual `tmux` command strings
- [x] Can create a new tmux session with windows
- [x] Can run commands in those windows
- [x] Error handling for parse failures
- [x] Dry-run mode for verification

### Phase 2: Windows Terminal (Secondary)
- [ ] `--backend=wt` flag to use Windows Terminal
- [ ] Generates `wt.exe` command strings
- [ ] WSL path translation handled

**Status:** Phase 1 complete. Phase 2 deferred to future PDA pass.

### Phase 2: Windows Terminal (Secondary)
- [ ] `--backend=wt` flag to use Windows Terminal
- [ ] Generates `wt.exe` command strings
- [ ] WSL path translation handled

### Should Have
- [ ] Dry-run mode (show commands without executing)
- [ ] Verbose output showing the full pipeline
- [ ] Support for `.themis` file discovery (directory scanning)

### Nice to Have
- [ ] Interactive mode
- [ ] Config file support
- [ ] Logging/journal writing to disk

---

## Technical Approach

1. **Create CLI entry point** (`src/cli.ts`)
   - Argument parsing
   - File reading
   - Pipeline orchestration
   - Backend selection (`--backend=tmux|wt`, default: tmux)

2. **Create tmux command builder** (`src/backend/tmux-command-builder.ts`)
   - Convert `BackendStep` to actual `tmux` commands
   - Handle session/window/pane creation

3. **Create WT command builder** (`src/backend/wt-command-builder.ts`)
   - Convert `BackendStep` to actual `wt.exe` arguments
   - Handle escaping, quoting, path translation

4. **Create execution layer** (`src/backend/executor.ts`)
   - Spawn processes (`tmux` or `wt.exe`)
   - Handle errors

5. **Add npm script** (`package.json`)
   - `themis` command available after install

---

## Verification Steps (Tmux)

**Using existing runtime DSL (terminal corpus preserved):**

```bash
# Create a test module
cat > dev.themis << 'EOF'
module "dev" {
  workspace "main" {
    context { "env" "dev" }
    persistence "ephemeral"
    equivalence "canonical"
    role "editor" {
      kind "service"
      subject { identity "editor" reference "e1" }
      realizer "Local" "vim"
    }
    role "server" {
      kind "service"
      subject { identity "server" reference "s1" }
      realizer "Local" "npm run dev"
    }
  }
}
EOF

# Run it
npx themis dev.themis

# Should attach to tmux session 'dev' with windows for each role
# Realizer "Local" "<command>" maps to tmux send-keys
```

## Verification Steps (Windows Terminal - Phase 2)

```bash
npx themis --backend=wt dev.themis
# Should open Windows Terminal with two tabs
```

---

## Notes

- WT is available at `/mnt/c/Users/Andrey/AppData/Local/Microsoft/WindowsApps/wt.exe`
- Need to handle WSL path conversion for `wt.exe` arguments
- Consider security implications of command execution
