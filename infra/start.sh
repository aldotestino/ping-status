#!/bin/sh

set -e

echo "Starting standalone ping-status service..."

# Run database migrations
echo "Running database migrations..."
cd /app/packages/db
bun run drizzle-kit migrate
cd /app

echo "Starting pinger service in background..."
bun run start:pinger &
PINGER_PID=$!

echo "Starting API server..."
bun run start:app &
APP_PID=$!

# Wait for both processes
wait $PINGER_PID $APP_PID

