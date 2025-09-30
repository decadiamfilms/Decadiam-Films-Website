#!/bin/bash

echo "🚀 Starting SalesKik Development Environment..."
echo ""

# Check if PostgreSQL is running
if ! brew services list | grep postgresql@16 | grep -q started; then
    echo "📦 Starting PostgreSQL..."
    brew services start postgresql@16
    sleep 2
fi

echo "✅ PostgreSQL is running"
echo ""

# Start both servers using npm run dev
echo "🔧 Starting development servers..."
echo ""
echo "📱 Frontend will be available at: http://localhost:3001"
echo "🖥️  Backend API will be available at: http://localhost:5001"
echo "📊 API Health check: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev