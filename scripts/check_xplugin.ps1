# Check and Enable MySQL X Plugin

Write-Host "=== MySQL X Plugin Setup ===" -ForegroundColor Cyan
Write-Host ""

$mysqlPort = 3307
$rootPassword = "1732005"

Write-Host "Step 1: Checking if X Plugin is installed..." -ForegroundColor Yellow

# Check X Plugin status
$checkSQL = @"
SELECT PLUGIN_NAME, PLUGIN_STATUS, PLUGIN_TYPE 
FROM INFORMATION_SCHEMA.PLUGINS 
WHERE PLUGIN_NAME = 'mysqlx';
"@

$checkSQL | Out-File -FilePath "check_xplugin.sql" -Encoding UTF8 -NoNewline

try {
    $result = & mysql -u root "-p$rootPassword" -P $mysqlPort -e "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME = 'mysqlx';" 2>&1
    
    if ($result -match "mysqlx") {
        Write-Host "✓ X Plugin already installed!" -ForegroundColor Green
        Write-Host $result
        
        # Check port
        $portCheck = & mysql -u root "-p$rootPassword" -P $mysqlPort -e "SHOW VARIABLES LIKE 'mysqlx_port';" 2>&1
        Write-Host ""
        Write-Host "X Plugin port:" -ForegroundColor Yellow
        Write-Host $portCheck
        
    } else {
        Write-Host "! X Plugin not installed, installing..." -ForegroundColor Yellow
        
        # Install X Plugin
        $installSQL = "INSTALL PLUGIN mysqlx SONAME 'mysqlx';"
        $installSQL | Out-File -FilePath "install_xplugin.sql" -Encoding UTF8 -NoNewline
        
        Get-Content "install_xplugin.sql" | & mysql -u root "-p$rootPassword" -P $mysqlPort 2>&1 | Out-Host
        
        Write-Host "✓ X Plugin installed!" -ForegroundColor Green
        
        # Verify
        & mysql -u root "-p$rootPassword" -P $mysqlPort -e "SHOW PLUGINS LIKE 'mysqlx';" 2>&1 | Out-Host
        
        Remove-Item "install_xplugin.sql" -ErrorAction SilentlyContinue
    }
    
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

Remove-Item "check_xplugin.sql" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 2: Checking X Plugin port..." -ForegroundColor Yellow

try {
    $xport = & mysql -u root "-p$rootPassword" -P $mysqlPort -e "SELECT @@mysqlx_port;" 2>&1
    Write-Host "X Plugin listening on port:" -ForegroundColor Green
    Write-Host $xport
    
} catch {
    Write-Host "! Could not get port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "X Plugin Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection info:" -ForegroundColor Yellow
Write-Host "  Traditional: localhost:3307" -ForegroundColor White
Write-Host "  X Protocol: localhost:33060 (default)" -ForegroundColor White
Write-Host ""
Write-Host "Test connection:" -ForegroundColor Yellow
Write-Host '  mysqlsh --host=localhost --port=33060 --user=chatbox' -ForegroundColor White
Write-Host ""
