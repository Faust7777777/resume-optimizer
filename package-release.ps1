param(
  [string]$OutputRoot = "release",
  [string]$PackageName = "resumeai-standalone"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "[1/6] Building project (standalone)..."
npm run build

$standalonePath = Join-Path $projectRoot ".next\standalone"
if (!(Test-Path $standalonePath)) {
  throw "standalone build output not found: $standalonePath"
}

$releaseRoot = Join-Path $projectRoot $OutputRoot
$appRoot = Join-Path $releaseRoot $PackageName
$zipPath = Join-Path $releaseRoot ("$PackageName.zip")

Write-Host "[2/6] Preparing release directory..."
if (Test-Path $appRoot) { Remove-Item $appRoot -Recurse -Force }
if (!(Test-Path $releaseRoot)) { New-Item -ItemType Directory -Path $releaseRoot | Out-Null }
New-Item -ItemType Directory -Path $appRoot | Out-Null

Write-Host "[3/6] Copying standalone runtime..."
Copy-Item (Join-Path $standalonePath "*") $appRoot -Recurse -Force

Write-Host "[4/6] Copying static/public assets..."
$staticSource = Join-Path $projectRoot ".next\static"
$staticTarget = Join-Path $appRoot ".next\static"
if (Test-Path $staticSource) {
  New-Item -ItemType Directory -Path $staticTarget -Force | Out-Null
  Copy-Item (Join-Path $staticSource "*") $staticTarget -Recurse -Force
}

$publicSource = Join-Path $projectRoot "public"
if (Test-Path $publicSource) {
  Copy-Item $publicSource (Join-Path $appRoot "public") -Recurse -Force
}

$workerPath = Join-Path $projectRoot "coze-worker.mjs"
if (Test-Path $workerPath) {
  Copy-Item $workerPath (Join-Path $appRoot "coze-worker.mjs") -Force
}

$envLocal = Join-Path $projectRoot ".env.local"
if (Test-Path $envLocal) {
  Copy-Item $envLocal (Join-Path $appRoot ".env.local") -Force
}

Write-Host "[5/6] Generating startup scripts..."
@"
@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set PORT=3000
set "SERVER_JS=%~dp0server.js"

if not exist "%SERVER_JS%" (
  set "SERVER_JS="
  for /r "%~dp0" %%f in (server.js) do (
    echo %%f | findstr /i "\\node_modules\\" >nul
    if errorlevel 1 (
      set "SERVER_JS=%%f"
      goto :found
    )
  )
)

if not "%SERVER_JS%"=="" goto :found

echo Cannot find server.js in package folder.
exit /b 1

:found
echo Starting ResumeAI on port %PORT%...
node "%SERVER_JS%"
"@ | Set-Content -Path (Join-Path $appRoot "start.bat") -Encoding ASCII

@"
# ResumeAI Standalone

## Run
1. Open terminal in this folder
2. Run: start.bat
3. Visit: http://localhost:3000

## Notes
- API routes are included in this standalone package.
- If AI features require keys, configure .env.local before start.
"@ | Set-Content -Path (Join-Path $appRoot "README.txt") -Encoding UTF8

Write-Host "[6/6] Compressing package..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $appRoot "*") -DestinationPath $zipPath -Force

Write-Host "Done."
Write-Host "Package folder: $appRoot"
Write-Host "Zip file: $zipPath"
