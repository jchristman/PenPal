#!/bin/bash

export LOCAL_USER_ID=$(id -u)
export LOCAL_GROUP_ID=$(id -g)

docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml down

rm -rf PenPal/app/node_modules
