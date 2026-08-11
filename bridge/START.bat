@echo off
title OM SHOP - Scale Bridge (Running)
echo.
echo =======================================
echo  OM SHOP - Scale Bridge STARTING
echo  Sharp RKS-35 - 9600 baud
echo =======================================
echo.
echo STEP 1: List available COM ports...
node -e "const {SerialPort}=require('serialport');SerialPort.list().then(p=>{if(p.length===0){console.log('  (no ports found - plug in USB adapter first!)')}else{p.forEach(x=>console.log('  '+x.path+' - '+(x.manufacturer||'Unknown')))}})"
echo.
echo STEP 2: Starting bridge...
echo   (Check config.json to change COM port)
echo   (Press Ctrl+C to stop)
echo.
node bridge.js
pause
