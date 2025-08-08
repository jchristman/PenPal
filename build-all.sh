#!/bin/bash

docker compose pull
docker compose build --build-arg UID=$(id -u) --build-arg PLATFORM=$(uname -m) penpal-base
docker compose build penpal-frontend
docker compose build penpal-server
docker compose build penpal-docker-api
