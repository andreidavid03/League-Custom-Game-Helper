#!/bin/bash

echo "🎮 LoL Custom Game Helper - Simple Start"
echo "======================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "Installing dependencies..."
npm run install:all

echo "Starting both servers..."
npm run dev