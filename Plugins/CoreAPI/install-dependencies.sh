#!/bin/bash

PACKAGES="fast-json-stable-stringify ip graphql-upload-ts"

echo "Installing CoreAPI dependencies"
if [ "$OFFLINE" = "true" ]; then
    echo "Offline set to true, installing from cache (if possible)"
    npm install --prefer-offline --no-audit $PACKAGES
else
    npm install $PACKAGES
fi