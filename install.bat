@echo off
echo ====================================================
echo             Installing Math Buddy App
echo ====================================================
echo.
echo Checking for Node.js/npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ first.
    pause
    exit /b 1
)

echo Node.js/npm found!
echo.
echo Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed.
    pause
    exit /b 1
)

echo.
echo Creating Desktop Shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Math Buddy.lnk')); $Shortcut.TargetPath = '%~dp0run.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'explorer.exe,0'; $Shortcut.Save()"
if %errorlevel% neq 0 (
    echo [WARNING] Could not create Desktop shortcut automatically.
) else (
    echo Desktop shortcut 'Math Buddy' created successfully!
)

echo.
echo ====================================================
echo   Installation completed successfully!
echo   You can now launch the app using the 'Math Buddy'
echo   shortcut on your Desktop, or by double-clicking 'run.bat'.
echo ====================================================
echo.
pause
