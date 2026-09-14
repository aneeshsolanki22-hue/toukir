@echo off
title Video Downloader
rem run from the folder this script lives in
cd /d "%~dp0"
node dist\cli.js
echo.
pause
