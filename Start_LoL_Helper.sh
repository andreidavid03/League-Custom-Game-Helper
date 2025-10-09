#!/bin/bash

# LoL Custom Game Helper by David Demon
# Startup script for macOS

echo "🎮 Starting LoL Custom Game Helper by David Demon..."
echo "⚔️ Loading League of Legends themed interface..."

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the application
"$DIR/publish/osx-arm64/LoLCustomGameHelper"

echo "🎯 Application closed. Thanks for playing!"