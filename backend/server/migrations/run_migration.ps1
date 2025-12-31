# Run Database Migration for Voice Messages & File Upload
# Usage: .\run_migration.ps1 -Username "your_username" -Database "chatbox_db"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "chatbox_db",
    
    [Parameter(Mandatory=$false)]
    [string]$Host = "localhost"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration: Add Message Metadata" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get password securely
$Password = Read-Host "Enter MySQL password for user '$Username'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "Connecting to MySQL..." -ForegroundColor Yellow

# Path to migration file
$MigrationFile = Join-Path $PSScriptRoot "001_add_message_metadata.sql"

if (-Not (Test-Path $MigrationFile)) {
    Write-Host "ERROR: Migration file not found: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file: $MigrationFile" -ForegroundColor Gray

# Run migration
try {
    Write-Host "Running migration..." -ForegroundColor Yellow
    
    # Use mysql command
    $mysqlCmd = "mysql -h $Host -u $Username -p$PlainPassword $Database"
    Get-Content $MigrationFile | & mysql -h $Host -u $Username "-p$PlainPassword" $Database
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Verify migration
        Write-Host "Verifying migration..." -ForegroundColor Yellow
        $verifyQuery = "DESCRIBE messages;"
        echo $verifyQuery | mysql -h $Host -u $Username "-p$PlainPassword" $Database
        
        Write-Host ""
        Write-Host "Migration applied successfully! New columns:" -ForegroundColor Green
        Write-Host "  - message_type (VARCHAR(20))" -ForegroundColor Green
        Write-Host "  - metadata (JSON)" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from memory
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host "Done!" -ForegroundColor Cyan
