$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetPath = Join-Path $projectDir "launch.vbs"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Rabins Video Player.lnk"

$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = """" + $targetPath + """"
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "Rabins Video Player - Media Hub"
$shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,179"
$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host "Double-click it to start Rabins Video Player."
