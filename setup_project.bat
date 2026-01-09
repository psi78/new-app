@echo off
TITLE 5K-DMS Project Setup
CLS
ECHO ==========================================
ECHO      5K-DMS Project Setup Wizard
ECHO ==========================================
ECHO.

IF NOT EXIST "package.json" (
    ECHO [ERROR] package.json not found! 
    ECHO Please run this script from the 'j' folder.
    PAUSE
    EXIT /B
)

ECHO [1/3] Installing dependencies (this may take a minute)...
CALL npm install
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] npm install failed. Do you have Node.js installed?
    PAUSE
    EXIT /B
)

ECHO.
ECHO [2/3] Configuring Environment...
IF NOT EXIST ".env" (
    ECHO Copying .env.example to .env...
    COPY .env.example .env
) ELSE (
    ECHO .env file already exists. Skipping copy.
)

ECHO.
ECHO [3/3] Setting up Database...
node setup_db.js

ECHO.
ECHO ==========================================
ECHO      Setup Complete!
ECHO ==========================================
ECHO.
ECHO To start the server, run: npm start
ECHO.
PAUSE
