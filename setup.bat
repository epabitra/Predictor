@echo off
echo 🚀 Setting up Tournament Predictor Application...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18.20.8 or higher first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
set NODE_VERSION=%NODE_VERSION:~1%

echo ✅ Node.js version %NODE_VERSION% is detected

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ Installation completed successfully!
echo.
echo 📋 Next steps:
echo 1. Copy backend\env.example to backend\.env
echo 2. Configure your Google Sheets API credentials in backend\.env
echo 3. Run 'npm run dev' to start both backend and frontend
echo.
echo 🔧 For detailed setup instructions, see README.md
echo.
echo 🎯 Happy predicting!
pause
