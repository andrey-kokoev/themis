#!/bin/bash
# Launch WT new tab in current window (best effort)
# From WSL, this will open new window. From within WT, opens in same window.

wt.exe new-tab --profile Ubuntu -- wsl.exe -d Ubuntu bash -c "cd '$PWD' && exec bash"
