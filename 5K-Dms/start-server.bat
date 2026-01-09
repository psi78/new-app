@echo off
echo Starting 5K Dormitory Management System...
echo.
echo Make sure you have:
echo 1. MySQL database running
echo 2. Database '5kdms_db' created
echo 3. .env file configured in backend folder
echo.
cd backend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
echo.
echo Starting server...
echo Server will be available at http://localhost:3000
echo.
call npm start
pause

