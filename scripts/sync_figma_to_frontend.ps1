<#
Sync figma/ frontend into frontend/ folder.

Usage: run this from the repo root in PowerShell:

  .\scripts\sync_figma_to_frontend.ps1

This will:
 - Remove and recreate `frontend/src` (overwrite without backup)
 - Copy files from `figma/src` -> `frontend/src`
 - Copy top-level files (index.html, package.json, vite.config.ts)
 - Leave node_modules untouched

Note: After running, run `cd frontend; npm install` then `npm run dev`.
#>

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repo = Resolve-Path "$root\.."

Write-Host "Repo root: $repo"

$figma = Join-Path $repo 'figma'
$frontend = Join-Path $repo 'frontend'

if (-not (Test-Path $figma)) {
    Write-Error "figma/ folder not found at $figma"
    exit 1
}

Write-Host "Removing existing frontend/src..."
Remove-Item -Path (Join-Path $frontend 'src') -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Copying figma/src -> frontend/src"
New-Item -ItemType Directory -Force -Path (Join-Path $frontend 'src') | Out-Null
Copy-Item -Path (Join-Path $figma 'src\*') -Destination (Join-Path $frontend 'src') -Recurse -Force

Write-Host "Copying top-level files: index.html, package.json, vite.config.ts"
foreach ($f in @('index.html','package.json','vite.config.ts')) {
    $srcf = Join-Path $figma $f
    if (Test-Path $srcf) {
        Copy-Item -Path $srcf -Destination (Join-Path $frontend $f) -Force
    }
}

Write-Host "Sync complete. You should run:\n  cd frontend; npm install; npm run dev"
