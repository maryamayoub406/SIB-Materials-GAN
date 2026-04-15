# ============================================================
# START BACKEND - Run from FYP root
# ============================================================
Write-Host ""
Write-Host "[ SIB Discovery Platform - FastAPI Backend ]" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend\main.py")) {
    Write-Host "[ERROR] Run this script from the FYP root directory!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "[WARN] backend\.env not found - copying from .env.example" -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

Write-Host "[INFO] Starting FastAPI backend on http://localhost:8000" -ForegroundColor Green
Write-Host "[INFO] API docs at http://localhost:8000/docs" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
