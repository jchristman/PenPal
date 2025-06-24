#!/bin/bash

# FileStore core doesn't need additional dependencies
# It uses the same dependencies as DataStore (FlakeId, etc.)

PACKAGES="graphql-upload-ts"

echo "Installing FileStore dependencies"
if [ "$OFFLINE" = "true" ]; then
    echo "Offline set to true, installing from cache (if possible)"
    npm install --prefer-offline --no-audit $PACKAGES
else
    npm install $PACKAGES
fi 