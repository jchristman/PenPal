#!/bin/bash

docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml pull
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build --build-arg UID=$(id -u) --build-arg PLATFORM=$(uname -m) penpal-base
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build penpal-frontend
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build penpal-server
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build penpal-docker-api
