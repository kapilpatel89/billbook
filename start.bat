@echo off
cd /d "%~dp0"
:: Launch server completely hidden in background (no CMD in taskbar)
start "" wscript.exe "%~dp0start_hidden.vbs"
exit
