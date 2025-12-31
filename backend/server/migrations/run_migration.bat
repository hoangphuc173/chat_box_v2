@echo off
REM Simple batch script to run MySQL migration
REM Usage: run_migration.bat <username> <database>

SET USERNAME=%1
SET DATABASE=%2

IF "%USERNAME%"=="" (
    SET /P USERNAME="Enter MySQL username: "
)

IF "%DATABASE%"=="" (
    SET DATABASE=chatbox_db
)

echo ========================================
echo Database Migration: Add Message Metadata
echo ========================================
echo.
echo Username: %USERNAME%
echo Database: %DATABASE%
echo.

REM Run migration
mysql -u %USERNAME% -p %DATABASE% < 001_add_message_metadata.sql

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Migration completed successfully!
    echo.
    echo Verifying migration...
    mysql -u %USERNAME% -p %DATABASE% -e "DESCRIBE messages;"
) ELSE (
    echo.
    echo ✗ Migration failed!
    exit /b 1
)

echo.
echo Done!
pause
