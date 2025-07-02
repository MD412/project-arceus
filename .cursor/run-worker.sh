#!/bin/bash

# Project Arceus Worker Runner
# Run this script from the project root to start the local worker

echo "🚀 Starting Project Arceus Worker..."
echo "📂 Current directory: $(pwd)"

# Change to worker directory
cd worker

# Check if model exists
if [ ! -f "pokemon_cards_trained.pt" ]; then
    echo "❌ Model file not found: pokemon_cards_trained.pt"
    exit 1
fi

# Check if config exists
if [ ! -f "config.py" ]; then
    echo "❌ Config file not found: config.py"
    exit 1
fi

echo "✅ Model and config found"
echo "🐍 Starting Python worker..."

# Run the local worker
python local_worker.py 