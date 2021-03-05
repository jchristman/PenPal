#!/bin/bash

docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml pull
docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build --build-arg UID=$(id -u)

