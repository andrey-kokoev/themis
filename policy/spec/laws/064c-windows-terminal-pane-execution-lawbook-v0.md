---
id: 064c-windows-terminal-pane-execution-lawbook-v0
title: "Windows Terminal Pane Execution Lawbook"
kind: lawbook
order: 66
---

# Windows Terminal Pane Execution Lawbook

Defines execution semantics for pane layouts in Windows Terminal backend.

---

## W1: Split Command Laws

### W1.1: Horizontal Split
`pane horizontal` SHALL generate:
```
wt.exe ... ; split-pane --horizontal -- <command>
```
Creates pane to the RIGHT of current pane.

### W1.2: Vertical Split
`pane vertical` SHALL generate:
```
wt.exe ... ; split-pane --vertical -- <command>
```
Creates pane BELOW current pane.

### W1.3: First Pane
First pane SHALL use `new-tab`. Subsequent panes use `split-pane`.

---

## W2: Sequence Laws

### W2.1: Single Invocation
All tabs and panes SHALL be created in single `wt.exe` invocation.

### W2.2: Split Sequence
```
wt.exe new-tab ... ; split-pane --horizontal ... ; split-pane --vertical ...
```

### W2.3: Command Association
Each pane SHALL include its command in the same clause:
```
wt.exe new-tab -- ... -- wsl.exe -e <command> ; split-pane --horizontal -- ... -- wsl.exe -e <command>
```

---

## W3: Layout Mapping

| Themis Layout | WT Flag | Visual Result |
|---------------|---------|---------------|
| horizontal | `--horizontal` | Panes side-by-side |
| vertical | `--vertical` | Panes stacked |

---

## W4: Example Mapping

Input:
```
tab "work" in local {
  pane horizontal { command "vim" }
  pane horizontal { command "bash" }
}
```

Output:
```
wt.exe new-tab --title work --profile Ubuntu -- ... -- wsl.exe -e vim ; split-pane --horizontal --title work --profile Ubuntu -- ... -- wsl.exe -e bash
```

---

## W5: Limitations

### W5.1: No Nested Splits
WT split-pane creates panes from CURRENT pane. Complex nested layouts may differ from tmux.

### W5.2: Tab Title Sharing
All panes in tab share tab title; pane titles not individually settable via CLI.
