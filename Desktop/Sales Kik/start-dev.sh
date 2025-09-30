#!/bin/bash

# SalesKik Development Server Startup Script
echo "🚀 Starting SalesKik Development Environment..."

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local timeout=30
    local counter=0
    
    echo "⏳ Waiting for server at $url..."
    while [ $counter -lt $timeout ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ Server ready at $url"
            return 0
        fi
        sleep 1
        counter=$((counter + 1))
    done
    echo "❌ Server failed to start within $timeout seconds"
    return 1
}

# Check if ports are available
echo "🔍 Checking ports..."
if ! check_port 5001; then
    echo "🔧 Killing existing server on port 5001..."
    pkill -f "ts-node.*server/index.ts" || true
    sleep 2
fi

if ! check_port 3001; then
    echo "🔧 Killing existing client on port 3001..."
    pkill -f "vite" || true
    sleep 2
fi

# Start the backend server
echo "🔧 Starting backend server..."
npm run server:dev &
SERVER_PID=$!

# Wait for server to be ready
if wait_for_server "http://localhost:5001/health"; then
    # Start the frontend client
    echo "🎨 Starting frontend client..."
    npm run client:dev &
    CLIENT_PID=$!
    
    # Wait for client to be ready
    if wait_for_server "http://localhost:3001"; then
        echo "🎉 Both servers are running!"
        echo "🔧 Backend: http://localhost:5001"
        echo "🎨 Frontend: http://localhost:3001"
        echo ""
        echo "📝 To stop both servers: kill $SERVER_PID $CLIENT_PID"
        echo "📝 Or press Ctrl+C and run: pkill -f 'ts-node.*server/index.ts'; pkill -f 'vite'"
        
        # Keep script running
        wait
    else
        echo "❌ Frontend failed to start"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
else
    echo "❌ Backend failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi