@echo off
title LoL Custom Game Helper by David Demon

echo 🎮 Starting LoL Custom Game Helper by David Demon...
echo ⚔️ Loading League of Legends themed interface...

REM Get the directory where the batch file is located
set "DIR=%~dp0"

REM Run the application
"%DIR%publish\win-x64\LoLCustomGameHelper.exe"

echo 🎯 Application closed. Thanks for playing!
pause