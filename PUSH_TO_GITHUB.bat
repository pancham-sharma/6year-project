@echo off
title Seva Marg Git Push
echo.
echo ===================================
echo    Pushing Changes to GitHub
echo ===================================
echo.

:: Ensure origin is correct
git remote set-url origin https://github.com/pancham-sharma/6year-project.git

echo.
echo [0/4] Untracking ignored files...
git rm --cached image.png PUSH.bat git_push.bat 2>nul

echo.
set /p msg="Enter commit message (or press enter for 'updates'): "
if "%msg%"=="" set msg=updates

echo [1/4] Adding files...
git add .

echo [2/4] Committing changes...
git commit -m "%msg%"

echo [3/4] Pushing to GitHub...
git push origin main --force

echo [4/4] Finalizing...
git push --set-upstream origin main

echo.
echo ===================================
echo           DONE!
echo ===================================
echo.
pause
