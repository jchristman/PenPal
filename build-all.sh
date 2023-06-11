#!/bin/bash

export LOCAL_USER_ID=$(id -u)
export PLATFORM=$(uname -m)

docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml pull
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build --build-arg LOCAL_USER_ID=$LOCAL_USER_ID --build-arg PLATFORM=$PLATFORM penpal-base
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build penpal-frontend
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml build penpal-server
