#!/bin/bash

# Use environment variable to determine which deps to install
echo
echo "Container type: ${CONTAINER_TYPE:-unknown}"
echo "Current working directory: $(pwd)"

cd /penpal/

# Copy package-tmp.json to package.json
cp package-tmp.json package.json

if [ "$CONTAINER_TYPE" = "frontend" ]; then
    echo "🎨 Frontend container - installing client dependencies only"

    echo Installing base client dependencies
    npm install --no-audit > /dev/null

    echo Adding dependencies from all client plugins
    find /penpal/plugins -path "*/client/npm-dependencies.txt" -type f -print0 | while read -d $'\0' file; do
        if [ -f "$file" ]; then
            echo "Installing dependencies from $file"
            npm install --no-audit $(cat $file) > /dev/null
        fi
    done
elif [ "$CONTAINER_TYPE" = "server" ]; then
    echo "⚙️ Server container - installing server dependencies only"

    echo Installing base server dependencies
    npm install --no-audit > /dev/null

    echo Adding dependencies from all server plugins
    find /penpal/plugins -path "*/server/npm-dependencies.txt" -type f -print0 | while read -d $'\0' file; do
        if [ -f "$file" ]; then
            echo "Installing dependencies from $file"
            npm install --no-audit $(cat $file) > /dev/null
        fi
    done
fi
