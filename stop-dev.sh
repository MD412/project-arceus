#!/bin/bash
# Stop development environment: Next.js dev server + Python worker

echo "🛑 Stopping development environment..."

# Kill Next.js dev server (node processes running next)
echo "📦 Stopping Next.js dev server..."
pkill -f "next dev" 2>/dev/null
pkill -f "node.*next" 2>/dev/null

# Kill Python worker
echo "🤖 Stopping Python worker..."
pkill -f "python3.*worker.py" 2>/dev/null

sleep 1

echo ""
echo "✅ Development environment stopped!"

