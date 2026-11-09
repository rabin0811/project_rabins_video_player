Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
scriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c ""cd /d """ & scriptPath & "\backend"" && pythonw run.py""", 0, False
WScript.Sleep 4000
WshShell.Run "http://localhost:8000"
