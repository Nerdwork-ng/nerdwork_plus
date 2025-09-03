@echo off
echo Starting Nerdwork+ Local Development Environment
echo.

REM Colors for Windows (limited)
echo [92m===========================================[0m
echo [92m    🚀 NERDWORK+ LOCAL DEVELOPMENT       [0m  
echo [92m===========================================[0m
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [91mError: Docker is not installed or running![0m
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo [93mStep 1: Starting Backend Services...[0m
cd /d "%~dp0..\backend"

REM Check if .env exists
if not exist .env (
    echo [93mCreating .env file from .env.example...[0m
    copy .env.example .env
    echo [91mIMPORTANT: Please update backend/.env with your database credentials![0m
    echo [91mPress any key to continue after updating .env...[0m
    pause
)

echo [93mStarting backend services with Docker Compose...[0m
docker-compose up -d auth-service user-service api-gateway

REM Wait for services to start
echo [93mWaiting for services to be ready...[0m
timeout /t 10 /nobreak >nul

REM Health check
echo [93mChecking service health...[0m
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [91mWarning: Backend services may not be ready yet[0m
    echo [93mYou can check status with: docker-compose logs[0m
)

echo.
echo [93mStep 2: Starting Frontend...[0m
cd /d "%~dp0..\apps\web\nerdwork-plus"

REM Install dependencies if needed
if not exist node_modules (
    echo [93mInstalling frontend dependencies...[0m
    npm install
)

echo [93mStarting Next.js development server...[0m
echo [96mFrontend will be available at: http://localhost:3001[0m
echo [96mBackend API Gateway at: http://localhost:3000[0m
echo.

start cmd /k "npm run dev"

echo [92m✅ Development environment started![0m
echo.
echo [96mServices:[0m
echo   - Frontend: http://localhost:3001
echo   - Backend API: http://localhost:3000  
echo   - Auth Service: http://localhost:3001
echo   - User Service: http://localhost:3002
echo.
echo [93mTo stop services: docker-compose down[0m
echo [93mTo view logs: docker-compose logs -f[0m
echo.
pause