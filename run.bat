@echo off
echo ====================================================
echo               Starting Math Buddy
echo ====================================================
echo.
echo Opening the app in your default browser...
start http://localhost:8000
echo.
echo Starting development server...
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server.
    pause
    exit /b 1
)
pause
