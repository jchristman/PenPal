#!/bin/bash

PACKAGES="biguint-format flake-idgen"

echo "Installing DataStore dependencies"
if [ "$OFFLINE" = "true" ]; then
    echo "Offline set to true, installing from cache (if possible)"
    npm install --prefer-offline --no-audit $PACKAGES
else
    npm install $PACKAGES
fi