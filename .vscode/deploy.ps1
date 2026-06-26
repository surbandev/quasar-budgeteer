# Runs Railway deploy in a separate console so the JS debugger does not hang
# on "Waiting for the debugger to disconnect..." after upload completes.
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$argList = '/c', 'npm run deploy & echo. & echo Deploy upload finished. Check Railway for build status. & pause'

Start-Process -FilePath 'cmd.exe' -ArgumentList $argList -WorkingDirectory $projectRoot | Out-Null
exit 0
