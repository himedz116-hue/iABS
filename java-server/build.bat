@echo off
echo [Build] Compiling Java Bot Server...
mkdir ..\lib 2>nul
javac -d ..\lib src\com\iabss\bot\KickBotServer.java
if errorlevel 1 (
    echo [Build] FAILED
    pause
    exit /b 1
)
echo [Build] Success! Compiled to ..\lib\
echo [Run] Use run.bat to start
pause
