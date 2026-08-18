@echo off
title POORVA SHOP - Scale Bridge (Running)
echo.
echo ================================================
echo   POORVA SHOP - Scale Bridge STARTING
echo   Sharp Scale RS232 - Auto baud detection
echo ================================================
echo.

echo STEP 1: Killing any old bridge processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.
echo.

echo STEP 2: Checking COM ports...
node -e "const {SerialPort}=require('serialport');SerialPort.list().then(p=>{if(p.length===0){console.log('  WARNING: No COM ports found! Plug in USB adapter first.')}else{p.forEach(x=>console.log('  Found:',x.path,'-',x.manufacturer||'Unknown'))}})"
echo.

echo STEP 3: Starting bridge...
echo   (Press Ctrl+C to stop)
echo.

node bridge.js

echo.
echo Bridge stopped.
pause
