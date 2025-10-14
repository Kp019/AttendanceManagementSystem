#!/bin/bash

# Event Participant Management - Development Startup Script

echo "🚀 Starting Event Participant Management System..."
echo ""

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  WARNING: Backend .env file not found!"
    echo "Please copy backend/.env.example to backend/.env and configure your environment variables."
    echo ""
fi

# Start backend
echo "📡 Starting Backend Server (Port 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🌐 Starting Frontend Development Server (Port 5173)..."
cd ../eventParticipantManagement && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "📡 Backend:  http://localhost:3001"
echo ""
echo "To stop both servers, press Ctrl+C"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait