#!/bin/bash
# Start development environment: Next.js dev server + Python worker

echo "🚀 Starting development environment..."

# Start Next.js dev server in background
echo "📦 Starting Next.js dev server..."
npm run dev &
NPM_PID=$!

# Give Next.js a moment to initialize
sleep 2

# Start Python worker in background
echo "🤖 Starting Python worker..."
python3 worker/worker.py &
WORKER_PID=$!

echo ""
echo "✅ Development environment running!"
echo "   Next.js: http://localhost:3000 (PID: $NPM_PID)"
echo "   Worker:  PID $WORKER_PID"
echo ""
echo "To stop: ./stop-dev.sh"

