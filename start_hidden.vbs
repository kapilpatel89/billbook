' ============================================================
' Pro Billbook GST - Silent Background Launcher
' Runs Node.js server completely hidden (No CMD in Taskbar)
' ============================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Launch Node server with WindowStyle = 0 (vbHide - 100% invisible, no taskbar button)
WshShell.Run "node server.js", 0, False

' Open browser at http://localhost:3000/ after 1 second
WshShell.Run "cmd /c timeout /t 1 /nobreak >nul & start http://localhost:3000/", 0, False
