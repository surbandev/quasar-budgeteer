# Import backend/.env variables into Railway (run after copying your .env file).
# Usage: .\scripts\railway-set-env.ps1

$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envFile)) {
  Write-Error "backend\.env not found. Copy your env file first:"
  Write-Host '  copy "path\to\Budgeteer-main\backend\.env" "backend\.env"'
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if ($key) {
    Write-Host "Setting $key"
    npx --yes @railway/cli variable set "$key=$value" --service budgeteer --skip-deploys | Out-Null
  }
}

npx --yes @railway/cli variable set PRODUCTION=true --service budgeteer --skip-deploys | Out-Null
Write-Host "Done. Redeploy with: npx @railway/cli up --detach -y --service budgeteer"
