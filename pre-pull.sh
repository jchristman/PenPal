#!/bin/bash

# Pre-pull script for PenPal project
# This script searches for and executes pre-pull.sh scripts in the Plugins directory
# to download large files that aren't included in the git repository

set -e  # Exit on any error

echo "🔄 Starting pre-pull process for PenPal..."

# Get the directory where this script is located (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="$SCRIPT_DIR/Plugins"

# Check if Plugins directory exists
if [ ! -d "$PLUGINS_DIR" ]; then
    echo "❌ Error: Plugins directory not found at $PLUGINS_DIR"
    exit 1
fi

echo "📁 Searching for pre-pull.sh scripts in $PLUGINS_DIR..."

# Find all pre-pull.sh scripts in the Plugins directory and subdirectories
PRE_PULL_SCRIPTS=$(find "$PLUGINS_DIR" -name "pre-pull.sh" -type f)

if [ -z "$PRE_PULL_SCRIPTS" ]; then
    echo "ℹ️  No pre-pull.sh scripts found in Plugins directory"
    echo "✅ Pre-pull process completed (no scripts to run)"
    exit 0
fi

echo "📋 Found the following pre-pull.sh scripts:"
echo "$PRE_PULL_SCRIPTS" | sed 's/^/   - /'
echo ""

# Execute each pre-pull.sh script
SCRIPT_COUNT=0
SUCCESS_COUNT=0
FAILED_SCRIPTS=""

for script in $PRE_PULL_SCRIPTS; do
    SCRIPT_COUNT=$((SCRIPT_COUNT + 1))
    SCRIPT_NAME=$(basename "$(dirname "$script")")
    SCRIPT_PATH=$(dirname "$script")

    echo "🚀 Executing pre-pull.sh for $SCRIPT_NAME..."
    echo "   Path: $script"

    # Change to the script's directory and execute it
    if cd "$SCRIPT_PATH" && bash "$script"; then
        echo "✅ Successfully executed pre-pull.sh for $SCRIPT_NAME"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ Failed to execute pre-pull.sh for $SCRIPT_NAME"
        FAILED_SCRIPTS="$FAILED_SCRIPTS $SCRIPT_NAME"
    fi

    echo ""
done

# Summary
echo "📊 Pre-pull process summary:"
echo "   Total scripts found: $SCRIPT_COUNT"
echo "   Successfully executed: $SUCCESS_COUNT"
echo "   Failed: $((SCRIPT_COUNT - SUCCESS_COUNT))"

if [ $SUCCESS_COUNT -eq $SCRIPT_COUNT ]; then
    echo "✅ All pre-pull scripts completed successfully!"
    exit 0
else
    echo "⚠️  Some pre-pull scripts failed:"
    for failed in $FAILED_SCRIPTS; do
        echo "   - $failed"
    done
    exit 1
fi
