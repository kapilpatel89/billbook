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

' Wait 1 second for server to initialize
WScript.Sleep 1000

' Open default browser
WshShell.Run "http://localhost:3000/"
