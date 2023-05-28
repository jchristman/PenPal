#!/bin/bash

echo
echo [.] Starting all services
echo

export LOCAL_USER_ID=$(id -u)
export LOCAL_GROUP_ID=$(id -g)
export RUN_LOCATION=$(pwd)
echo $RUN_LOCATION
docker compose -f docker-compose.common.yaml -f docker-compose.dev.yaml up -d penpal-server penpal-frontend

echo
echo "[.] Execute the following commands to attach to stdout the container(s)"
echo 
echo docker compose -f docker-compose.common.yaml logs -f penpal-server penpal-frontend
echo
echo [.] To shutdown the containers, run the following command
echo
echo ./stop-dev.sh
echo
