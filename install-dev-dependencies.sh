#!/bin/bash

# Development script to install plugin dependencies for VSCode Intellisense
# This creates a root-level node_modules with all plugin dependencies
# Run this when plugin dependencies change to update Intellisense
#
# Usage: ./install-dev-dependencies.sh
#
# This script:
# 1. Creates a root package.json if it doesn't exist
# 2. Installs main client dependencies
# 3. Installs all plugin client dependencies from npm-dependencies.txt files
# 4. Creates a root-level node_modules for VSCode Intellisense

set -e

echo "🔧 Installing development dependencies for VSCode Intellisense..."

# Create a basic package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📄 Creating root package.json..."
    cat > package.json << 'EOF'
{
  "name": "penpal-dev",
  "version": "0.1.0",
  "description": "Development dependencies for VSCode Intellisense",
  "private": true,
  "dependencies": {}
}
EOF
fi

# Merge client and server dependencies
echo "📦 Merging client and server dependencies..."
if [ -f "PenPal/app/client/package.json" ] && [ -f "PenPal/app/server/package.json" ]; then
    # Merge the two package.json files, combining dependencies and devDependencies
    node -e "
        const fs = require('fs');
        const client = JSON.parse(fs.readFileSync('PenPal/app/client/package.json', 'utf8'));
        const server = JSON.parse(fs.readFileSync('PenPal/app/server/package.json', 'utf8'));

        const merged = {
            ...client,
            ...server,
            dependencies: { ...client.dependencies, ...server.dependencies },
            devDependencies: { ...client.devDependencies, ...server.devDependencies }
        };

        fs.writeFileSync('package.json', JSON.stringify(merged, null, 2));
    "
    npm install --silent
elif [ -f "PenPal/app/client/package.json" ]; then
    cp PenPal/app/client/package.json package.json
    npm install --silent
elif [ -f "PenPal/app/server/package.json" ]; then
    cp PenPal/app/server/package.json package.json
    npm install --silent
fi

# Install all plugin client dependencies
echo "🔌 Installing plugin client dependencies..."
find Plugins -path "*/client/npm-dependencies.txt" -type f -print0 | while read -d $'\0' file; do
    if [ -f "$file" ]; then
        plugin_name=$(basename "$(dirname "$(dirname "$file")")")
        echo "Installing dependencies from $plugin_name plugin"

        # Read the entire file content (space-separated packages)
        deps=$(cat "$file")
        if [ -n "$deps" ]; then
            echo "  Installing: $deps"
            npm install $deps --silent
        fi
    fi
done

echo "✅ Development dependencies installed for Intellisense!"
echo ""
echo "📝 Notes:"
echo "  - This creates a root-level node_modules for development only"
echo "  - Production containers use their own isolated node_modules"
echo "  - Run this script whenever plugin dependencies change"
echo "  - VSCode should now resolve imports from plugins correctly"
