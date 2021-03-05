FROM debian:buster-slim

ARG UID=1000

RUN apt-get update
RUN apt-get install curl -y

# Install node.js and Mongo
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN curl -sL https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list

# Mongo wants to run systemctl, so link /bin/true to always return 0
RUN ln -s /bin/true /bin/systemctl

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
    sudo git-core build-essential openssl libssl-dev \
    procps entr nodejs python mongodb-org file lsof \
    netcat ca-certificates

# Install docker in docker....
ENV DOCKERVERSION=19.03.12
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKERVERSION}.tgz \
  && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 -C /usr/local/bin docker/docker \
  && rm docker-${DOCKERVERSION}.tgz

RUN mkdir -p /data/db

# Install npm
RUN curl -L https://npmjs.org/install.sh | sh
RUN npm install -g npm

# Workaround for untar not working on docker overlayFS. Needed for meteor install
RUN apt-get install -y --no-install-recommends bsdtar
RUN cp $(which tar) /bin/tar.bak
RUN ln -sf $(which bsdtar) $(which tar)

# Add gosu for our user ID magic
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture).asc" \
    && gpg --verify /usr/local/bin/gosu.asc \
    && rm /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu

# Create an unpriv user for meteor to run as
RUN groupadd -r node
RUN useradd --no-log-init -r -u $UID -g node node
RUN cp -rT /etc/skel /home/node
RUN chown -R node:node /home/node
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Make our source directory and chown it to the new user
RUN mkdir /app
RUN chown node:node /app

# Make the working directory
RUN mkdir /n8n
RUN chown node:node /n8n
RUN chown -R node:node /usr/lib/node_modules

# Drop privs to the node user
USER node

# Install lerna
RUN sudo npm install -g lerna

# Install n8n
WORKDIR n8n

# Clone n8n
RUN git clone https://github.com/n8n-io/n8n.git .

# Now reduce the number of modules to only the whitelist. Requires some messy code
RUN sudo npm install -g any-json
COPY --chown=node:node ./node-whitelist-remove.sh /tmp
COPY --chown=node:node ./node-whitelist.txt /tmp
RUN chmod +x /tmp/node-whitelist-remove.sh && /tmp/node-whitelist-remove.sh

# This repairs a broken package.json file from us removing unnecessary packages
RUN any-json --input-format=hjson /n8n/packages/nodes-base/package.json > /n8n/packages/nodes-base/package.json.bak
RUN mv /n8n/packages/nodes-base/package.json.bak /n8n/packages/nodes-base/package.json

# And finally replace all of the individual font awesome imports with importing all icons
RUN cat /n8n/packages/editor-ui/src/main.ts | perl -0777 -pe 's/import \{\n(.*\n)*.*free-solid.*/import { fas } from "\@fortawesome\/free-solid-svg-icons";/g' | perl -0777 -pe 's/library.add(.*\n)*library.add.*/library.add(fas);/g' > /n8n/packages/editor-ui/src/main.ts.bak
RUN mv /n8n/packages/editor-ui/src/main.ts.bak /n8n/packages/editor-ui/src/main.ts

# Bootstrap with lerna
RUN lerna bootstrap --hoist

# Build n8n
RUN npm run build

# Install dev tools for n8n-nodes
RUN sudo npm install -g n8n-node-dev

# Some more configuration for n8n-node-dev
RUN sudo npm install -g oauth-1.0a
RUN cat /usr/lib/node_modules/n8n-node-dev/src/tsconfig-build.json | sed -e 's!"types": \[\],!"types": \[\],\n\t\t"resolveJsonModule": true,!g' > /tmp/tsconfig-buid.json; mv /tmp/tsconfig-buid.json /usr/lib/node_modules/n8n-node-dev/src/tsconfig-build.json

# Expose n8n port
EXPOSE 5678

# Install npm-recursive-install for merging of package.json dependencies
RUN sudo npm install -g recursive-install

# Now install PenPal dependencies
# Make /app the working directory
WORKDIR /app

# Install meteor
RUN curl https://install.meteor.com/ | sh

# Update path so we don't need to put meteor into /usr/bin/meteor
ENV PATH="${PATH}:/home/node/.meteor"

# Now put the old tar back in place
USER root
RUN ln -sf /bin/tar.bak $(which tar)

USER node
COPY --chown=node:node src/package.json /app/package.json

# Importantly run npm install for the bundled version of npm that's with meteor.
# You need to do this instead of "new" npm native because otherwise certain modules
# will compile or download the wrong native binaries based on the node version that
# is bundled.
RUN meteor npm install

# Now copy all of the src into /app
COPY --chown=node:node src/ /app

# Do this build to install all relevant packages to reduce build times in development mode
# Note that this ignores errors.
RUN meteor update
RUN EXIT=1 meteor run --once; exit 0

RUN export BIND_IP=0.0.0.0
EXPOSE 3000
EXPOSE 9229

# Drop back to root. The docker entrypoint will drop to node user privileges
USER root

# For `docker run CONTAINER_ID`
COPY ./docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
