@echo off
title Seva Marg Git Push
echo.
echo ===================================
echo    Pushing Changes to GitHub
echo ===================================
echo.

:: Check for changes
git status -s

echo.
set /p msg="Enter commit message (or press enter for 'updates'): "
if "%msg%"=="" set msg=updates

echo.
echo [1/3] Adding files...
git add .

echo [2/3] Committing changes...
git commit -m "%msg%"

echo [3/3] Pushing to GitHub...
git push

echo.
echo ===================================
echo           DONE!
echo ===================================
echo.
pause
