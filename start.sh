#!/usr/bin/env bash

# Resolve project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "=========================================="
echo " Starting MyChatBot (Backend + Frontend) "
echo "=========================================="

# Cleanup function to gracefully stop all background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    wait 2>/dev/null
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend with uv and uvicorn
echo "-> Launching FastAPI Backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR" || exit 1
uv run uvicorn api.api_conn:app --app-dir src/backend --reload --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend Vite server
echo "-> Launching Vite Frontend on http://localhost:5173..."
cd "$FRONTEND_DIR" || exit 1
npm run dev &
FRONTEND_PID=$!

# 3. Wait for services to initialize
echo "-> Waiting for server readiness..."
sleep 2

# 4. Open GUI in default browser
URL="http://localhost:5173"
echo "-> Opening $URL in your browser..."
if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "$URL" > /dev/null 2>&1 &
elif command -v open > /dev/null 2>&1; then
    open "$URL" > /dev/null 2>&1 &
elif [ -n "$BROWSER" ]; then
    "$BROWSER" "$URL" > /dev/null 2>&1 &
else
    echo "Notice: Open $URL in your browser to view the GUI."
fi

echo "=========================================="
echo " System is active!"
echo " Backend:  http://127.0.0.1:8000"
echo " Frontend: http://localhost:5173"
echo " Press Ctrl+C at any time to stop both."
echo "=========================================="

# Keep script running to maintain child processes
wait
