#!/bin/bash

# Nerdwork+ Local Development Environment Startup Script
# This script starts backend services and frontend for local testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}    🚀 NERDWORK+ LOCAL DEVELOPMENT       ${NC}"
echo -e "${GREEN}===========================================${NC}"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Start Backend Services
echo -e "${YELLOW}Step 1: Starting Backend Services...${NC}"
cd "$(dirname "$0")/../backend"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}IMPORTANT: Please update backend/.env with your database credentials!${NC}"
    echo -e "${RED}Press Enter to continue after updating .env...${NC}"
    read
fi

echo -e "${YELLOW}Starting backend services with Docker Compose...${NC}"
docker-compose up -d auth-service user-service api-gateway

# Wait for services to start
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}Checking service health...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend services are healthy${NC}"
else
    echo -e "${RED}⚠️  Warning: Backend services may not be ready yet${NC}"
    echo -e "${YELLOW}You can check status with: docker-compose logs${NC}"
fi

# Step 2: Start Frontend
echo
echo -e "${YELLOW}Step 2: Starting Frontend...${NC}"
cd "$(dirname "$0")/../apps/web/nerdwork-plus"

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${YELLOW}Starting Next.js development server...${NC}"
echo -e "${CYAN}Frontend will be available at: http://localhost:3001${NC}"
echo -e "${CYAN}Backend API Gateway at: http://localhost:3000${NC}"
echo

# Start frontend in background and keep script running
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Development environment started!${NC}"
echo
echo -e "${CYAN}Services:${NC}"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend API: http://localhost:3000"
echo "  - Auth Service: http://localhost:3001"  
echo "  - User Service: http://localhost:3002"
echo
echo -e "${YELLOW}To test the API endpoints:${NC}"
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:3000/auth/health"
echo "  curl http://localhost:3000/users/health"
echo
echo -e "${YELLOW}To stop services:${NC}"
echo "  - Press Ctrl+C to stop this script"
echo "  - Run: docker-compose down (in backend directory)"
echo

# Keep script running
trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; kill $FRONTEND_PID 2>/dev/null; exit' INT
wait $FRONTEND_PID