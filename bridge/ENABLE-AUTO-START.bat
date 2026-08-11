@echo off
title OM SHOP — Enable Auto-Start
echo.
echo =======================================
echo  OM SHOP — Enable Scale Auto-Start
echo =======================================
echo.
echo This will make the scale bridge start
echo AUTOMATICALLY every time PC is turned on.
echo.
echo No terminal, no window — runs silently!
echo.
set STARTUP="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
copy /Y "C:\OM SHOP\bridge\om-shop-bridge.vbs" %STARTUP%\OM-SHOP-Bridge.vbs

if %ERRORLEVEL% == 0 (
  echo.
  echo ✅ SUCCESS! Bridge will now auto-start on every PC reboot.
  echo.
  echo Location: %STARTUP%\OM-SHOP-Bridge.vbs
  echo.
  echo You can also START it right now by double-clicking
  echo the file above, or just restart the PC.
) else (
  echo.
  echo ❌ ERROR — Run this file as Administrator:
  echo    Right-click → "Run as administrator"
)
echo.
pause
