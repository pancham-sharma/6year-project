@echo off
echo Syncing assets from User to Admin...
if not exist "admin\public\images" mkdir "admin\public\images"
copy "user\public\*.jpeg" "admin\public\" /Y
copy "user\public\images\*.jpg" "admin\public\images\" /Y
echo Done!
pause
