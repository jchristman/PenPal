#!/bin/bash

export LOCAL_USER_ID=$(id -u)
export LOCAL_GROUP_ID=$(id -g)

echo Shutting down containers on the network
DOCKER_NETWORKS=$(docker network ls | egrep -i "${PWD##*/}" | awk '{print $2}')
for network in $DOCKER_NETWORKS
do
    CONTAINERS=$(docker network inspect $network | jq -r '.[].Containers[] | .Name')
    for container in $CONTAINERS
    do
        docker stop $container
    done
done

echo Shutting down the core
docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml down