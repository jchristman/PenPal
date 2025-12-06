#!/bin/bash

# Test TypeScript compilation script for PenPal server and client
# This script runs TypeScript compilation in the Docker containers and streams output
#
# Usage: ./test-ts-compilation.sh [client|server|all]
#   client: Test only client TypeScript compilation
#   server: Test only server TypeScript compilation
#   all: Test both client and server TypeScript compilation (default)

set -e  # Exit on any error

# Parse arguments
TARGET=${1:-all}

# Validate target
if [[ "$TARGET" != "client" && "$TARGET" != "server" && "$TARGET" != "all" ]]; then
    echo "❌ Invalid target: $TARGET"
    echo "Usage: $0 [client|server|all]"
    exit 1
fi

# Set required environment variables
export LOCAL_USER_ID=${LOCAL_USER_ID:-$(id -u)}
export RUN_LOCATION=${RUN_LOCATION:-local}

echo "🧪 Testing TypeScript compilation in Docker containers..."
echo "📋 Environment: LOCAL_USER_ID=${LOCAL_USER_ID}, RUN_LOCATION=${RUN_LOCATION}"
echo "🎯 Target: $TARGET"

# Function to run TypeScript compilation in a container
run_tsc() {
    local service_name=$1
    local service_display_name=$2
    local working_dir=$3

    echo "🔍 Testing TypeScript compilation for ${service_display_name}..."

    if ! docker compose ps | grep -q "${service_name}"; then
        echo "📦 ${service_display_name} container not running. Starting ${service_name} container..."

        # Run the tsc --noEmit command in the container
        LOCAL_USER_ID=$(id -u) RUN_LOCATION=local docker compose run --rm ${service_name} bash -c "cd ${working_dir} && npm install && echo 'Running TypeScript compilation...' && ./node_modules/.bin/tsc --noEmit"
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            echo "✅ ${service_display_name} TypeScript compilation successful!"
        else
            echo "❌ ${service_display_name} TypeScript compilation failed with exit code $exit_code"
            return $exit_code
        fi

        echo "✅ ${service_display_name} TypeScript compilation successful!"
    else
        echo "📦 ${service_display_name} container is running. Running compilation..."

        # Run the tsc --noEmit command in the running container
        docker compose exec ${service_name} bash -c "cd ${working_dir} && echo 'Running TypeScript compilation...' && ./node_modules/.bin/tsc --noEmit"
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            echo "✅ ${service_display_name} TypeScript compilation successful!"
        else
            echo "❌ ${service_display_name} TypeScript compilation failed with exit code $exit_code"
            return $exit_code
        fi
    fi
}

# Test compilation based on target
if [[ "$TARGET" == "server" || "$TARGET" == "all" ]]; then
    run_tsc "penpal-server" "PenPal Server" "/penpal"
fi

if [[ "$TARGET" == "client" || "$TARGET" == "all" ]]; then
    run_tsc "penpal-frontend" "PenPal Client" "/penpal"
fi

echo "🎉 TypeScript compilation tests passed for target: $TARGET"
