@echo off
echo ========================================
echo   iABS Bot Server
echo ========================================
echo.
echo Starting bot server...
echo.

cd bot-server

echo Installing dependencies...
call npm install

echo.
echo Starting bot server...
echo.
node server.js

pause
