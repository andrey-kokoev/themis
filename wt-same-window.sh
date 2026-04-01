#!/bin/bash
# Launch WT in same window from WSL using window ID

# Get the PID of the current shell's terminal
PARENT_PID=$PPID

# Use PowerShell to find the WT window containing our process
powershell.exe -NoProfile -Command "
\$p = Get-Process -Id $PARENT_PID -ErrorAction SilentlyContinue
if (\$p) {
  \$wt = Get-Process WindowsTerminal | Where-Object { \$_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (\$wt) {
    wt.exe -w \$wt.Id new-tab --profile Ubuntu -- wsl.exe -d Ubuntu bash -c \"cd '$PWD' && bash\"
  } else {
    wt.exe new-tab --profile Ubuntu -- wsl.exe -d Ubuntu bash -c \"cd '$PWD' && bash\"
  }
} else {
  wt.exe new-tab --profile Ubuntu -- wsl.exe -d Ubuntu bash -c \"cd '$PWD' && bash\"
}
"
