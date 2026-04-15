# ============================================================
# START FRONTEND - Run from FYP root
# ============================================================
Write-Host ""
Write-Host "[ SIB Discovery Platform - React Frontend ]" -ForegroundColor Magenta
Write-Host ""

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[INFO] Installing npm dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --ignore-scripts
    node node_modules\esbuild\install.js 2>$null
    Set-Location ..
}

Write-Host "[INFO] Starting React dev server on http://localhost:5173" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Set-Location frontend
node .\node_modules\vite\bin\vite.js
