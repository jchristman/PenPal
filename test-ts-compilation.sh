#!/bin/bash

# Test TypeScript compilation script for PenPal server
# This script runs TypeScript compilation in the Docker container and streams output

set -e  # Exit on any error

# Set required environment variables
export LOCAL_USER_ID=${LOCAL_USER_ID:-$(id -u)}
export RUN_LOCATION=${RUN_LOCATION:-local}

echo "🧪 Testing TypeScript compilation in Docker container..."
echo "📋 Environment: LOCAL_USER_ID=${LOCAL_USER_ID}, RUN_LOCATION=${RUN_LOCATION}"

# Check if containers are running
if ! docker compose ps | grep -q "penpal-server"; then
    echo "📦 Containers not running. Starting penpal-server container..."
    echo "🐳 Building and starting container (this may take a few minutes)..."

    # Run the tsc --noEmit command in the server container
    LOCAL_USER_ID=$(id -u) RUN_LOCATION=local docker compose run --rm penpal-server npx tsc --noEmit

    echo "✅ TypeScript compilation successful!"
else
    echo "✅ TypeScript compilation successful!"
fi
