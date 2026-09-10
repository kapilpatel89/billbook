@echo off
setlocal
title Pro Billbook GST - Local Server

cd /d "%~dp0"

echo =====================================================================
echo           PRO BILLBOOK GST - 100%% OFFLINE LOCAL RUNNING
echo =====================================================================
echo.
echo   Local App URL    : http://localhost:3000/
echo   Database Folder  : %~dp0database\
echo   Invoices Folder  : %~dp0data\invoices\
echo   Parties Folder   : %~dp0data\parties\
echo   Backups Folder   : %~dp0database\backups\
echo.
echo   * All bills and party data are saved physically to local folders.
echo   * No internet connection or online database is required.
echo.
echo   Launching default browser... (Press Ctrl+C to stop the server)
echo =====================================================================
echo.

:: Automatically open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start Node.js local server
node server.js

pause
