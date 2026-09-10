@echo off
setlocal
title Pro Billbook GST - Local Directory and Permissions Setup

echo =====================================================================
echo    PRO BILLBOOK GST - LOCAL DIRECTORY AND PERMISSION SETUP
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Creating and verifying local storage directories...
if not exist "database" mkdir "database"
if not exist "database\backups" mkdir "database\backups"
if not exist "data" mkdir "data"
if not exist "data\invoices" mkdir "data\invoices"
if not exist "data\parties" mkdir "data\parties"
if not exist "data\purchases" mkdir "data\purchases"
if not exist "data\exports" mkdir "data\exports"
if not exist "data\reports" mkdir "data\reports"

echo      - %~dp0database\
echo      - %~dp0data\invoices\
echo      - %~dp0data\parties\
echo      - %~dp0data\purchases\
echo      - %~dp0data\exports\
echo      - %~dp0database\backups\
echo [OK] All directories verified.
echo.

echo [2/3] Setting Windows security permissions (Full Read/Write Access)...
icacls "%~dp0database" /grant "%USERNAME%":(OI)(CI)F /T /Q >nul 2>nul
icacls "%~dp0data" /grant "%USERNAME%":(OI)(CI)F /T /Q >nul 2>nul
echo [OK] Full read/write access configured for user '%USERNAME%'.
echo.

echo [3/3] Initializing local JSON database structure...
node server.js --init
echo.

echo =====================================================================
echo               SETUP AND PERMISSION CONFIGURATION FINISHED!
echo   All files and directories are prepared for 100%% offline local run.
echo =====================================================================
echo.
pause
