FROM debian:bullseye-slim

ARG UID=1000
ARG PLATFORM=x86_64
ARG IS_SERVER=0

# Last updated on 01-19-2021
# https://github.com/nodesource/distributions#installation-instructions
ARG NODE_VERSION=19
# https://github.com/tianon/gosu/releases
ARG GOSU_VERSION=1.14
# https://github.com/tianon/gosu#installation
ARG GOSU_GPG=B42F6819007F00F88E364FD4036A9C25BF357DD4

SHELL ["/bin/bash", "-c"]

# Generic necessities
RUN apt-get update
RUN apt-get install -y sudo curl build-essential

# Install node.js and Mongo
RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Install docker in docker....
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates gnupg lsb-release
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update
RUN apt-get install -y docker-ce docker-ce-cli containerd.io

# Add gosu for our user ID magic
RUN gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-$(dpkg --print-architecture).asc" \
    && gpg --verify /usr/local/bin/gosu.asc \
    && rm /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu

# Create an unpriv user for node to run as
RUN groupadd -r node
RUN useradd --no-log-init -r -u $UID -g node node
RUN cp -rT /etc/skel /home/node
RUN chown -R node:node /home/node
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Make our source directory and chown it to the new user
RUN mkdir -p /penpal/app
RUN mkdir -p /penpal/plugins
RUN chown -R node:node /penpal

# Install npm-recursive-install for merging of package.json dependencies
RUN npm install -g recursive-install
RUN npm install -g npm@9.6.4

# For `docker run CONTAINER_ID`
COPY ./docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
COPY ./install-dependencies.sh /usr/bin/install-dependencies.sh
ENTRYPOINT ["docker-entrypoint.sh"]
