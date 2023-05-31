#!/bin/bash

# Need both compose files to mount the source code for things like npm install
docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml run --rm --entrypoint /bin/bash penpal-server -c "$@"