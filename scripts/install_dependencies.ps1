# vcpkg and Dependencies Installation Script

Write-Host "=== Installing Build Dependencies ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\ADMIN\Downloads\ChatBox web"
$vcpkgRoot = "$projectRoot\vcpkg"

# Check if git is installed
Write-Host "Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not found! Please install Git first." -ForegroundColor Red
    Write-Host "  Download: https://git-scm.com/download/win" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing vcpkg..." -ForegroundColor Yellow

if (Test-Path $vcpkgRoot) {
    Write-Host "! vcpkg already exists, skipping clone..." -ForegroundColor Yellow
} else {
    try {
        Set-Location $projectRoot
        git clone https://github.com/Microsoft/vcpkg.git
        Write-Host "✓ vcpkg cloned!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to clone vcpkg: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 2: Bootstrapping vcpkg..." -ForegroundColor Yellow

Set-Location $vcpkgRoot

if (Test-Path ".\vcpkg.exe") {
    Write-Host "! vcpkg.exe already exists, skipping bootstrap..." -ForegroundColor Yellow
} else {
    try {
        .\bootstrap-vcpkg.bat
        Write-Host "✓ vcpkg bootstrapped!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Bootstrap failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 3: Integrating vcpkg..." -ForegroundColor Yellow

try {
    .\vcpkg integrate install
    Write-Host "✓ vcpkg integrated!" -ForegroundColor Green
} catch {
    Write-Host "! Integration warning (might be OK): $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Installing MySQL Connector..." -ForegroundColor Yellow
Write-Host "This may take 10-15 minutes..." -ForegroundColor Gray

try {
    .\vcpkg install mysql-connector-cpp:x64-windows
    Write-Host "✓ MySQL Connector installed!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install MySQL Connector: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Installing other dependencies..." -ForegroundColor Yellow

$packages = @(
    "openssl:x64-windows",
    "curl:x64-windows",
    "zlib:x64-windows"
)

foreach ($pkg in $packages) {
    Write-Host "  Installing $pkg..." -ForegroundColor Gray
    try {
        .\vcpkg install $pkg
        Write-Host "  ✓ $pkg installed!" -ForegroundColor Green
    } catch {
        Write-Host "  ! $pkg failed (might already be installed)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Dependencies Installed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installed packages:" -ForegroundColor Yellow
.\vcpkg list | Select-String "mysql|openssl|curl|zlib"
Write-Host ""
Write-Host "Next step: Build the server!" -ForegroundColor Yellow
Write-Host "  cd backend\server" -ForegroundColor White
Write-Host "  mkdir build" -ForegroundColor White
Write-Host "  cd build" -ForegroundColor White
Write-Host "  cmake .." -ForegroundColor White
Write-Host "  cmake --build . --config Release" -ForegroundColor White
Write-Host ""
