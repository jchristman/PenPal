#!/bin/bash

PACKAGES="shell-quote stream-to-string node-pty"

echo "Adding Docker dependencies"
if [ "$OFFLINE" = "true" ]; then
    echo "Offline set to true, installing from cache (if possible)"
    npm install --prefer-offline --no-audit $PACKAGES
else
    npm install $PACKAGES
fi