#!/bin/bash

echo "🚀 Starting AthleteAI Development Environment"
echo "============================================"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found. Please run ./setup_oauth.sh first"
    exit 1
fi

# Check if OAuth credentials are configured
if grep -q "your-google-client-id" backend/.env 2>/dev/null; then
    echo "⚠️  OAuth credentials not fully configured."
    echo "   Please update backend/.env with your OAuth credentials"
    echo "   Run ./setup_oauth.sh for setup instructions"
    echo ""
fi

echo "📦 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "🌐 Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   🔗 Backend: http://localhost:5000"
echo "   🔗 Frontend: http://localhost:3000"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for user interrupt
wait
