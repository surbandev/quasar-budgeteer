# Run Quasar + API locally against Railway production MySQL.
$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envFile = Join-Path $projectRoot 'backend\.env.railway'

if (-not (Test-Path $envFile)) {
  Write-Host "backend/.env.railway not found — creating from .env.railway-restore + .env..."
  & (Join-Path $PSScriptRoot 'setup-env-railway.ps1')
}

$env:BUDGETEER_ENV_FILE = '.env.railway'
Set-Location $projectRoot
npx concurrently -n api,web -c blue,green "npm start --prefix backend" "npm run dev"
