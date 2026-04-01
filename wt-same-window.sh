#!/bin/bash
# Launch WT in same window from WSL

WT_ARGS="$@"

powershell.exe -NoProfile -Command "
  Add-Type @'
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
      [DllImport(\"user32.dll\")]
      public static extern IntPtr GetForegroundWindow();
    }
'@
  $hwnd = [Win32]::GetForegroundWindow()
  $procs = Get-Process WindowsTerminal -ErrorAction SilentlyContinue
  $windowId = $null
  foreach ($p in $procs) {
    if ($p.MainWindowHandle -eq $hwnd) {
      $windowId = $p.Id
      break
    }
  }
  if ($windowId) {
    wt.exe -w $windowId $WT_ARGS
  } else {
    wt.exe $WT_ARGS
  }
"
