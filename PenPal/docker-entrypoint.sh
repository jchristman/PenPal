#!/bin/bash

USER_ID=${LOCAL_USER_ID:-$(id -u node)}
CURRENT_NODE_UID=$(id -u node)

if [[ $USER_ID -eq 0 ]]; then
	echo RUNNING AS ROOT. THIS IS NOT RECOMMENDED. IT WILL CAUSE PAIN BECAUSE OF DOCKER PERMISSIONS...
	echo Sleeping 10 seconds before continuing...
	sleep 10

    install-dependencies.sh

	exec "$@"

	exit
fi

if [[ ! $CURRENT_NODE_UID -eq $USER_ID ]]; then
	echo Changing UID of 'node' user to $USER_ID
	usermod -u $USER_ID node

	echo Restarting sudo
	service sudo restart

	echo Changing file permissions of /penpal
	chown -R node:node /penpal
else
	echo UID matches inside container. Moving on
fi

# Make bun available to the node user and set up bun directory
cp /root/.bun/bin/bun /usr/local/bin/bun
chmod +x /usr/local/bin/bun
mkdir -p /home/node/.bun && chown -R node:node /home/node/.bun
/usr/local/bin/gosu node install-dependencies.sh

exec /usr/local/bin/gosu node "$@"
