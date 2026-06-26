# Restore the latest local backup into Railway MySQL.
# 1. Copy backend/.env.railway-restore.example -> backend/.env.railway-restore
# 2. Fill MYSQL public proxy host/port/password from Railway MySQL service variables
# 3. Run: npm run db:restore:railway

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envFile = Join-Path $projectRoot 'backend\.env.railway-restore'

if (-not (Test-Path $envFile)) {
  Write-Error "Create backend/.env.railway-restore from backend/.env.railway-restore.example first."
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  Set-Item -Path "env:$key" -Value $value
}

$backupRoot = Join-Path $projectRoot 'backups'
$latest = Get-ChildItem $backupRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $latest) {
  Write-Error "No backups found in backups/. Run npm run db:backup first."
}

$sqlFile = Join-Path $latest.FullName 'full-backup.sql'
Write-Host "Restoring backup: $sqlFile"
Write-Host "Target host: $($env:DB_HOST):$($env:DB_PORT)"

node (Join-Path $projectRoot 'backend\scripts\restore-databases.js') $sqlFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Restore complete."
