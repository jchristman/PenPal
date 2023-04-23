#!/bin/bash

echo Installing base dependencies
npm install

echo
echo Installing packages from all plugins
find /penpal/app/plugins -name "install-dependencies.sh" -type f -print0 | while read -d $'\0' file; do
    if [ -x "$file" ]; then
        "$file"
    fi
done