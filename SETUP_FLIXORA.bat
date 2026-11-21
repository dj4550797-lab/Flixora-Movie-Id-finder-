@echo off
setlocal enabledelayedexpansion
title Flixora Setup

:: ==============================================================================
:: Flixora Movie ID Finder — Setup Launcher
:: SETUP_FLIXORA.bat
:: ==============================================================================

:MENU
cls
color 0B

echo.
echo   ███████╗██╗     ██╗██╗  ██╗ ██████╗ ██████╗  █████╗
echo   ██╔════╝██║     ██║╚██╗██╔╝██╔═══██╗██╔══██╗██╔══██╗
echo   █████╗  ██║     ██║ ╚███╔╝ ██║   ██║██████╔╝███████║
echo   ██╔══╝  ██║     ██║ ██╔██╗ ██║   ██║██╔══██╗██╔══██║
echo   ██║     ███████╗██║██╔╝ ██╗╚██████╔╝██║  ██║██║  ██║
echo   ╚═╝     ╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo   ════════════════════════════════════════════════════════
echo            Movie ID Finder  —  Setup Launcher
echo   ════════════════════════════════════════════════════════
echo.
echo     [1]  Check Environment
echo     [2]  Configure Supabase
echo     [3]  Deploy Database
echo     [4]  Open Website
echo     [5]  Exit
echo.
echo   ════════════════════════════════════════════════════════
echo.
set /p CHOICE=    Enter your choice (1-5): 

if "%CHOICE%"=="1" goto CHECK_ENV
if "%CHOICE%"=="2" goto CONFIGURE
if "%CHOICE%"=="3" goto DEPLOY
if "%CHOICE%"=="4" goto OPEN_SITE
if "%CHOICE%"=="5" goto EXIT

echo.
echo   Invalid choice. Please enter a number between 1 and 5.
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:CHECK_ENV
cls
echo.
echo   Running environment check...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\check-environment.ps1"
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:CONFIGURE
cls
echo.
echo   Starting Supabase configuration...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-supabase.ps1"
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:DEPLOY
cls
echo.
echo   Starting database deployment...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-supabase.ps1"
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:OPEN_SITE
cls
echo.
echo   Opening Flixora in your default browser...
echo.
start "" "%~dp0index.html"
echo   Done! Check your browser.
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:EXIT
cls
echo.
echo   Thanks for using Flixora Setup. Goodbye!
echo.
exit /b 0
