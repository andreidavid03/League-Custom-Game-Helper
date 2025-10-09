#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "   🎮 LoL Custom Game Helper"
echo "   Starting servers..."
echo "========================================"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    read -p "Press any key to exit..."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    read -p "Press any key to exit..."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo -e "${YELLOW}Installing dependencies...${NC}"
echo

# Install backend dependencies
echo -e "${CYAN}[1/4] Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install backend dependencies${NC}"
        read -p "Press any key to exit..."
        exit 1
    fi
fi

# Install frontend dependencies
echo -e "${CYAN}[2/4] Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install frontend dependencies${NC}"
        read -p "Press any key to exit..."
        exit 1
    fi
fi

echo -e "${CYAN}[3/4] Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && npm run dev\""
else
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="LoL Helper Backend" -- bash -c "cd '$SCRIPT_DIR/backend' && npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -title "LoL Helper Backend" -e "cd '$SCRIPT_DIR/backend' && npm run dev; bash" &
    else
        echo -e "${YELLOW}Warning: Could not open new terminal for backend. Starting in background...${NC}"
        npm run dev &
    fi
fi

# Wait for backend to start
sleep 3

echo -e "${CYAN}[4/4] Starting frontend server...${NC}"
cd "$SCRIPT_DIR/frontend"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && npm run dev\""
else
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="LoL Helper Frontend" -- bash -c "cd '$SCRIPT_DIR/frontend' && npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -title "LoL Helper Frontend" -e "cd '$SCRIPT_DIR/frontend' && npm run dev; bash" &
    else
        echo -e "${YELLOW}Warning: Could not open new terminal for frontend. Starting in background...${NC}"
        npm run dev &
    fi
fi

echo
echo -e "${GREEN}========================================"
echo "   🚀 Servers are starting..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   "
echo "   Wait for both terminals to show 'Ready'"
echo "   then open http://localhost:3000"
echo "========================================${NC}"
echo

# Wait a bit then try to open the browser
sleep 5

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:3000 &
    elif command -v google-chrome &> /dev/null; then
        google-chrome http://localhost:3000 &
    fi
fi

echo -e "${PURPLE}Press any key to exit this window...${NC}"
read -n 1 -s


