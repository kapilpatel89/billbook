@echo off
cd /d "%~dp0"
echo Stopping Pro Billbook background server...
taskkill /F /IM node.exe >nul 2>&1
echo Pro Billbook server has been stopped.
timeout /t 2 >nul
exit
