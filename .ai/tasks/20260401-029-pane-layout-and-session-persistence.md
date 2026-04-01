# Task 029: Pane Layout and Session Persistence

**Status:** IN PROGRESS  
**Started:** 2026-04-01  
**Target:** Enable pane layouts and cross-reboot session restoration

---

## Objective

Extend Themis DSL and backends to support:
1. **Pane definitions** within tabs
2. **Layout specifications** (horizontal/vertical splits)
3. **Session persistence** for post-reboot restoration

---

## User Intent State

**Current:** Themis creates tabs with single commands. No pane control.

**Target:** 
```themis
tab "kimi-work" in local {
  pane horizontal {
    command "kimi"
  }
  pane horizontal {
    command "bash"
  }
}
tab "dev" in local layout vertical {
  pane { command "vim" }
  pane { command "npm run dev" }
}
```

**Persistence:** After reboot, `themis restore` recreates the workspace.

---

## Acceptance Criteria

### Must Have
- [ ] DSL syntax for `pane` within `tab`
- [ ] `layout horizontal|vertical` modifier
- [ ] Tmux backend generates `split-window` commands
- [ ] WT backend generates `split-pane` commands
- [ ] Session state saved to `.themis-state.json`

### Should Have
- [ ] Pane focus specification
- [ ] Pane size ratios (50/50, 30/70, etc.)
- [ ] Named layouts for reuse

---

## Technical Approach

### Phase 1: DSL Extension
1. Extend parser with `pane` and `layout` tokens
2. Update AST types for PaneBlock, LayoutClause
3. Add lowering rules

### Phase 2: Backend Extension
1. Tmux: `split-window -h` (horizontal) / `-v` (vertical)
2. WT: `split-pane --horizontal` / `--vertical`

### Phase 3: Persistence
1. Save session structure to state file
2. `themis restore` reads state, recreates layout

---

## Lawbook 064: Pane Layout Semantics

### P1: Pane Structure
- Tab contains 1+ panes
- Default: single pane fills tab
- Multiple panes: splits according to layout

### P2: Layout Semantics
- `horizontal`: panes side-by-side
- `vertical`: panes stacked top-to-bottom
- Nested: layout applies at each split level

### P3: Persistence
- State captures: session name, tabs, panes, commands
- State stored: `.themis-state.json` alongside `.themis` file
- Restore recreates structure, re-runs commands
