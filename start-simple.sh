#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "   🎮 LoL Custom Game Helper"
echo "   Simple Startup"
echo "========================================"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Install root dependencies if needed
echo -e "${YELLOW}[1/3] Installing root dependencies...${NC}"
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install backend dependencies
echo -e "${YELLOW}[2/3] Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install frontend dependencies
echo -e "${YELLOW}[3/3] Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo
echo -e "${GREEN}Starting both servers...${NC}"
echo -e "${YELLOW}Backend will be on: http://localhost:3001${NC}"
echo -e "${YELLOW}Frontend will be on: http://localhost:3000${NC}"
echo
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
echo

# Go back to root and start both servers using npm script
cd "$SCRIPT_DIR"
npm run dev