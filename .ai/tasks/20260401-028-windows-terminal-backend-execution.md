# Task 028: Windows Terminal Backend Execution

**Status:** IN PROGRESS  
**Started:** 2026-04-01  
**Target:** Enable Windows Terminal as operational backend

---

## Objective

Implement Windows Terminal (WT) backend for Themis CLI, enabling:
- `--backend=wt` flag to launch tabs in Windows Terminal
- Native Windows GUI experience vs tmux TUI
- One-shot workspace launching (no persistence/re-attach)

---

## User Intent State

**Current:** Tmux backend works but is TUI-based and persists sessions.

**Target:** Launch workspaces in Windows Terminal for native Windows GUI experience.

**Trade-off:** WT provides better visual integration but no session persistence.

---

## Acceptance Criteria

### Must Have
- [x] `--backend=wt` flag selects Windows Terminal backend
- [x] Generates valid `wt.exe` command strings
- [x] Creates new WT window with tabs per role
- [x] Handles WSL path translation (\\wsl$\Ubuntu\...)
- [x] Graceful error if WT not available

### Should Have
- [x] Support WT profiles (Ubuntu, PowerShell, etc.)
- [x] Tab titles reflect role names
- [x] Starting directory set to workspace location

---

## Technical Approach

1. **Create WT command builder** (`src/backend/wt-command-builder.ts`)
   - Map roles to `wt.exe new-tab` commands
   - Handle WSL path translation
   - Build command-line argument sequences

2. **Create WT executor** (`src/backend/wt-executor.ts`)
   - Spawn `wt.exe` process
   - Handle Windows path resolution
   - Fire-and-forget (no blocking attach)

3. **Update CLI** (`src/cli.ts`)
   - Route to WT backend when `--backend=wt`
   - Skip attach step (WT doesn't block)

4. **Lawbook 060** defining WT backend laws

5. **Tests** for WT command generation

---

## WT Command Structure

```bash
# Launch new WT window with multiple tabs
wt.exe new-tab --title "editor" --profile Ubuntu -- wsl.exe -d Ubuntu -e vim ; \
     new-tab --title "server" --profile Ubuntu -- wsl.exe -d Ubuntu -e "npm start"
```

Or using WSL integration:
```bash
wt.exe new-tab --title "editor" --startingDirectory \\wsl$\Ubuntu\home\andrey\project -- wsl.exe vim
```

---

## Verification

```bash
# Create test module
cat > wt-test.themis << 'EOF'
module "wt-test" {
  workspace "main" {
    context { "env" "test" }
    persistence "ephemeral"
    equivalence "canonical"
    role "editor" {
      kind "service"
      subject { identity "ed" reference "e1" }
      realizer "Local" "htop"
      witness "Process" "running"
    }
  }
}
EOF

# Dry run
npx themis --backend=wt --dry-run wt-test.themis

# Execute (opens new WT window)
npx themis --backend=wt wt-test.themis
```
