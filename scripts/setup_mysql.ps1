# MySQL Auto Setup Script for ChatBox
# Fixed PowerShell version

Write-Host "=== ChatBox MySQL Setup ===" -ForegroundColor Cyan
Write-Host ""

# MySQL configuration
$mysqlPort = 3307
$rootPassword = "1732005"
$chatboxPassword = "chatbox123"

# Paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$schemaFile = Join-Path $projectRoot "database\schema.sql"
$envFile = Join-Path $projectRoot "config\.env"
$envTemplate = Join-Path $projectRoot "config\.env.mysql"

Write-Host "Step 1: Creating database and user..." -ForegroundColor Yellow

# Create setup SQL
$setupSQL = @"
DROP DATABASE IF EXISTS chatbox_db;
CREATE DATABASE chatbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'chatbox'@'localhost';
CREATE USER 'chatbox'@'localhost' IDENTIFIED BY '$chatboxPassword';
GRANT ALL PRIVILEGES ON chatbox_db.* TO 'chatbox'@'localhost';
FLUSH PRIVILEGES;
"@

$setupSQL | Out-File -FilePath "temp_setup.sql" -Encoding UTF8 -NoNewline

# Run setup using Get-Content | mysql
try {
    Get-Content "temp_setup.sql" | & mysql -u root "-p$rootPassword" -P $mysqlPort 2>&1 | Out-Host
    Write-Host "✓ Database and user created!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
    Remove-Item "temp_setup.sql" -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item "temp_setup.sql" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 2: Importing schema..." -ForegroundColor Yellow

# Import schema
try {
    if (Test-Path $schemaFile) {
        Get-Content $schemaFile | & mysql -u chatbox "-p$chatboxPassword" -P $mysqlPort chatbox_db 2>&1 | Out-Host
        Write-Host "✓ Schema imported!" -ForegroundColor Green
    } else {
        Write-Host "✗ Schema file not found: $schemaFile" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Failed to import schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating config file..." -ForegroundColor Yellow

# Create .env file
$configContent = @"
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=chatbox
MYSQL_PASSWORD=chatbox123
MYSQL_DATABASE=chatbox_db

# Server Configuration
SERVER_IP=0.0.0.0
SERVER_PORT=8080

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
USER_QUOTA=104857600

# JWT
JWT_SECRET=chatbox_jwt_secret_$(Get-Random -Maximum 99999)
JWT_EXPIRY=86400
"@

$configContent | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline
Write-Host "✓ Config created: $envFile" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Verifying setup..." -ForegroundColor Yellow

# Verify tables
try {
    $tables = & mysql -u chatbox "-p$chatboxPassword" -P $mysqlPort -D chatbox_db -e "SHOW TABLES;" 2>&1
    Write-Host "✓ Tables created:" -ForegroundColor Green
    Write-Host $tables -ForegroundColor Gray
} catch {
    Write-Host "! Could not verify (but might be OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ MySQL Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Info:" -ForegroundColor Yellow
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 3307" -ForegroundColor White
Write-Host "  Database: chatbox_db" -ForegroundColor White
Write-Host "  User: chatbox" -ForegroundColor White
Write-Host "  Password: chatbox123" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Install vcpkg" -ForegroundColor White
Write-Host "  2. Install MySQL Connector (vcpkg)" -ForegroundColor White
Write-Host "  3. Build server" -ForegroundColor White
Write-Host ""
