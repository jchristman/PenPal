FROM debian:bullseye-slim

ARG UID=1000
ARG PLATFORM=x86_64
ARG IS_SERVER=0

# Last updated on 10-15-2023
# https://github.com/nodesource/distributions#installation-instructions
ARG NODE_VERSION=20
# https://github.com/tianon/gosu/releases
ARG GOSU_VERSION=1.16
# https://github.com/tianon/gosu#installation
ARG GOSU_GPG=B42F6819007F00F88E364FD4036A9C25BF357DD4

SHELL ["/bin/bash", "-c"]

# Generic necessities
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates gnupg lsb-release sudo curl build-essential

# Install node.js
RUN sudo mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_VERSION.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Install docker in docker....
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

# Create an unpriv user for node to run as. Note the user still gets sudo and docker group, so it's only kind of unpriv
RUN groupadd -r node
RUN useradd --no-log-init -r -u $UID -g node node
RUN usermod -aG docker node
RUN cp -rT /etc/skel /home/node
RUN chown -R node:node /home/node
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Make our source directory and chown it to the new user
RUN mkdir -p /penpal/
RUN mkdir -p /penpal/plugins
RUN chown -R node:node /penpal

# Update npm to latest version
RUN npm install -g npm@latest

# For `docker run CONTAINER_ID`
COPY ./docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
COPY ./install-dependencies.sh /usr/bin/install-dependencies.sh
ENTRYPOINT ["docker-entrypoint.sh"]
