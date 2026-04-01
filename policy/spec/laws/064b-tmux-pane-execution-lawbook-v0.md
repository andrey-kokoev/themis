---
id: 064b-tmux-pane-execution-lawbook-v0
title: "Tmux Pane Execution Lawbook"
kind: lawbook
order: 65
---

# Tmux Pane Execution Lawbook

Defines execution semantics for pane layouts in tmux backend.

---

## T1: Split Command Laws

### T1.1: Horizontal Split
`pane horizontal` SHALL generate:
```
tmux split-window -h -t <target>
```
Creates pane to the RIGHT of current pane.

### T1.2: Vertical Split
`pane vertical` SHALL generate:
```
tmux split-window -v -t <target>
```
Creates pane BELOW current pane.

### T1.3: Target Specification
Target format: `<session>:<window>.<pane-index>`
- First pane: `<session>:<window>.0` (implicit in new-window)
- Subsequent panes: `<session>:<window>.<n>`

---

## T2: Sequence Laws

### T2.1: First Pane
First pane SHALL be created implicitly by `new-window`.

### T2.2: Subsequent Panes
Each additional pane SHALL:
1. Target the PREVIOUS pane index
2. Split according to layout modifier
3. Result in new pane at next index

### T2.3: Command Delivery
After all splits, commands SHALL be sent to correct pane indices:
```
tmux send-keys -t <session>:<window>.<index> '<command>' C-m
```

---

## T3: Layout Mapping

| Themis Layout | Tmux Flag | Visual Result |
|---------------|-----------|---------------|
| horizontal | `-h` | Panes side-by-side |
| vertical | `-v` | Panes stacked |

---

## T4: Example Mapping

Input:
```
tab "work" in local {
  pane horizontal { command "vim" }
  pane horizontal { command "bash" }
}
```

Output:
```
tmux new-window -t <session> -n work
tmux split-window -h -t <session>:work.0
tmux send-keys -t <session>:work.0 'vim' C-m
tmux send-keys -t <session>:work.1 'bash' C-m
```
