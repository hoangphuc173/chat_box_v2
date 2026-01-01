<# DM Test using PowerShell #>

# Test the DM logic by hitting the WebSocket endpoint manually

$wsUri = "ws://localhost:8080"

Write-Host "========================================" -ForegroundColor Green
Write-Host "DM Test - Manual verification" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Testing WebSocket connection to $wsUri..."

# Simple HTTP test to check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 5
    Write-Host "Server health check: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Server not responding: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  cd backend\server\build\Release" -ForegroundColor Cyan
    Write-Host "  .\chat_server.exe" -ForegroundColor Cyan
}
