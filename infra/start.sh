#!/bin/sh

set -e

echo "Starting standalone ping-status service..."

# Run database migrations
echo "Running database migrations..."
cd /app/packages/db
bun run drizzle-kit migrate
cd /app

echo "Starting services with PM2..."
pm2-runtime start /app/ecosystem.config.cjs
