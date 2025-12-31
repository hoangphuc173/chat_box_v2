@echo off
REM Quick Start - Run Tests (Windows)

echo 🧪 ChatBox Testing Suite
echo =======================
echo.

REM Check if backend is running
echo Checking backend server...
curl -s http://localhost:8080 > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend server not detected on localhost:8080
    echo    Please start the backend server first
)

REM Check if frontend is running
echo Checking frontend server...
curl -s http://localhost:5173 > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Frontend server not detected on localhost:5173
    echo    Please start the frontend server first
)

echo.
echo Installing dependencies...
call npm install

echo.
echo 📋 Available test commands:
echo.
echo   npm test                  - Run all tests with coverage
echo   npm run test:integration  - Run WebSocket integration tests
echo   npm run test:features     - Run feature tests
echo   npm run test:e2e          - Run E2E browser tests
echo   npm run test:load         - Run load tests
echo   npm run test:stress       - Run stress tests
echo   npm run test:coverage     - Generate coverage report
echo.
echo What would you like to run?
echo.
echo 1^) All tests
echo 2^) Integration tests only
echo 3^) E2E tests only
echo 4^) Performance tests
echo 5^) Exit
echo.
set /p choice="Enter choice [1-5]: "

if "%choice%"=="1" (
    echo Running all tests...
    call npm test
) else if "%choice%"=="2" (
    echo Running integration tests...
    call npm run test:integration
) else if "%choice%"=="3" (
    echo Running E2E tests...
    call npm run test:e2e
) else if "%choice%"=="4" (
    echo Running performance tests...
    echo 1^) Load test ^(Artillery^)
    echo 2^) Stress test ^(1000 connections^)
    set /p perf_choice="Choose [1-2]: "
    if "!perf_choice!"=="1" (
        call npm run test:load
    ) else (
        call npm run test:stress
    )
) else if "%choice%"=="5" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo ✅ Tests complete!
pause
