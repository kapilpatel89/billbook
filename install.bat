@echo off
setlocal EnableDelayedExpansion
title Pro Billbook GST - Windows Local Installer and Setup

echo =====================================================================
echo           PRO BILLBOOK GST - WINDOWS INSTALLER AND SETUP
echo       100%% Local Running - Local Disk Database - No Online DB
echo =====================================================================
echo.

cd /d "%~dp0"

:: Step 1: Check Node.js installation
echo [Step 1/5] Checking Node.js runtime environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js was not found on your system.
    echo.
    echo Pro Billbook requires Node.js (v18 or newer) for local file database.
    echo.
    set /p "INSTALL_NODE=Would you like to download and install Node.js automatically? (Y/N): "
    if /i "!INSTALL_NODE!"=="Y" (
        echo.
        echo [*] Downloading Node.js LTS Installer (64-bit)...
        set "NODE_MSI=%TEMP%\nodejs_setup.msi"
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi' -OutFile '!NODE_MSI!'"
        if exist "!NODE_MSI!" (
            echo [*] Launching Node.js installer. Please complete the installer dialog...
            msiexec /i "!NODE_MSI!"
            echo [*] Node.js installation wizard finished.
            echo [*] Note: You may need to reopen this command prompt after installation.
        ) else (
            echo [!] Download failed. Please download Node.js manually from: https://nodejs.org/
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Please download and install Node.js manually from: https://nodejs.org/
        echo Then run this install.bat again.
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
    echo [OK] Node.js is installed: !NODE_VER! (npm v!NPM_VER!)
)

echo.
:: Step 2: Create local database and data directory hierarchy
echo [Step 2/5] Creating local folders for bills, parties, database and backups...
if not exist "database" mkdir "database"
if not exist "database\backups" mkdir "database\backups"
if not exist "data" mkdir "data"
if not exist "data\invoices" mkdir "data\invoices"
if not exist "data\parties" mkdir "data\parties"
if not exist "data\purchases" mkdir "data\purchases"
if not exist "data\exports" mkdir "data\exports"
if not exist "data\reports" mkdir "data\reports"
echo [OK] Local folders verified:
echo      - %~dp0database\
echo      - %~dp0data\invoices\
echo      - %~dp0data\parties\
echo      - %~dp0database\backups\

echo.
:: Step 3: Configure Windows directory permissions
echo [Step 3/5] Configuring Windows directory permissions for full local read/write...
icacls "%~dp0database" /grant "%USERNAME%":(OI)(CI)F /T /Q >nul 2>nul
icacls "%~dp0data" /grant "%USERNAME%":(OI)(CI)F /T /Q >nul 2>nul
echo [OK] Read/Write permissions granted to user: %USERNAME%

echo.
:: Step 4: Initialize database files
echo [Step 4/5] Initializing local database files...
node server.js --init
if %errorlevel% neq 0 (
    echo [!] Database initialization encountered an issue.
) else (
    echo [OK] Local database initialized successfully.
)

echo.
:: Step 5: Create Windows Desktop Shortcut
echo [Step 5/5] Creating Windows Desktop Shortcut...
set "TARGET_VBS=%~dp0start_hidden.vbs"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Pro Billbook GST.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Pro Billbook Indian GST Invoicing and Billing Software (Local Offline)'; $s.Save()" >nul 2>nul

if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop Shortcut created: "Pro Billbook GST"
) else (
    echo [INFO] Desktop shortcut could not be created automatically. You can double-click start.bat directly.
)

echo.
echo =====================================================================
echo                SETUP COMPLETED SUCCESSFULLY!
echo =====================================================================
echo   All bills, parties, and data will be saved locally in:
echo   - %~dp0database\
echo   - %~dp0data\invoices\
echo.
echo   To run Pro Billbook anytime:
echo   - Double-click the Desktop Shortcut: "Pro Billbook GST"
echo   - OR run "start.bat" in this folder.
echo =====================================================================
echo.

set /p "LAUNCH_NOW=Would you like to start Pro Billbook now? (Y/N): "
if /i "!LAUNCH_NOW!"=="Y" (
    echo.
    echo Starting Pro Billbook...
    call "%~dp0start.bat"
) else (
    echo You can start the app anytime by running start.bat. Have a great day!
    pause
)
