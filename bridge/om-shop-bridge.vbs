' OM SHOP — Scale Bridge Auto-Start
' This file runs silently in the background when Windows starts.
' Double-click "ENABLE-AUTO-START.bat" to install this.

Dim WshShell
Set WshShell = CreateObject("WScript.Shell")

' Run Node.js bridge silently (no terminal window pops up)
WshShell.Run "node ""C:\OM SHOP\bridge\bridge.js""", 0, False

Set WshShell = Nothing
