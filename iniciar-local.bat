@echo off
title Servidor Local – LevelUp
cd /d "%~dp0"

echo.
echo  =========================================
echo   Iniciando servidor local de LevelUp...
echo  =========================================
echo.

node servidor.js &
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/student.html"
node servidor.js
