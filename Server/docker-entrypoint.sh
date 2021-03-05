#!/bin/bash

USER_ID=${LOCAL_USER_ID:-$(id -u node)}
CURRENT_NODE_UID=$(id -u node)

if [[ $USER_ID -eq 0 ]]; then
	echo RUNNING AS ROOT. THIS IS NOT RECOMMENDED. IT WILL CAUSE PAIN BECAUSE OF DOCKER PERMISSIONS...
	echo Sleeping 10 seconds before continuing...
	sleep 10

	echo Installing packages from all package.json files
	npm-recursive-install --rootDir=plugins

	exec "$@"

	exit
fi

if [[ ! $CURRENT_NODE_UID -eq $USER_ID ]]; then
	echo Changing UID of 'node' user to $USER_ID
	usermod -u $USER_ID node

	echo Restarting sudo
	service sudo restart

	echo Changing file permissions of /app, /n8n, and /usr/lib/node_modules
	chown -R node:node /app /n8n /usr/lib/node_modules /home/node/custom-n8n-nodes
else
	echo UID matches inside container. Moving on
fi

echo Installing packages from all package.json files
npm-recursive-install --rootDir=plugins

exec /usr/local/bin/gosu node "$@"
