#!/bin/bash
# Launch WT in current window using PowerShell to get window ID

# Build the WT args
WT_ARGS="new-tab --title conversation --profile Ubuntu -- wsl.exe -d Ubuntu bash -c 'cd /home/andrey/src/themis && echo Hello; sleep 5' ; split-pane --horizontal --profile Ubuntu -- wsl.exe -d Ubuntu bash -c 'cd /home/andrey/src/themis && echo World; sleep 5'"

# Use PowerShell to get current WT window and launch there
powershell.exe -Command "
  \$wt = Get-Process WindowsTerminal | Select-Object -First 1
  if (\$wt) {
    wt.exe -w \$wt.Id $WT_ARGS
  } else {
    wt.exe $WT_ARGS
  }
"
