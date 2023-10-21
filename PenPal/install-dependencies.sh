#!/bin/bash

echo
echo Adding dependencies from all plugins
find /penpal/app/plugins -name "install-dependencies.sh" -type f -print0 | while read -d $'\0' file; do
    if [ -x "$file" ]; then
        "$file"
    fi
done

if [ "$OFFLINE" = "true" ]; then
    echo "Offline set to true, skipping npm install"
    npm install --prefer-offline --no-audit
else
    echo Installing dependencies
    npm install
fi
