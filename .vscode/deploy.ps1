# Deprecated: use `node .vscode/deploy.js` (cross-platform).
# Kept so older Windows launch configs still work.
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot
node .vscode/deploy.js
exit $LASTEXITCODE
