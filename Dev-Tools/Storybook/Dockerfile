FROM debian:buster-slim

ARG UID=1000

RUN apt-get update
RUN apt-get install curl wget -y

# Install node.js
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install git-core build-essential openssl libssl-dev procps entr nodejs python sudo -y

# Install fswatch
WORKDIR /tmp
RUN wget https://github.com/emcrisostomo/fswatch/releases/download/1.14.0/fswatch-1.14.0.tar.gz
RUN tar xvzf fswatch-1.14.0.tar.gz
WORKDIR /tmp/fswatch-1.14.0
RUN ./configure
RUN make
RUN make install
RUN ldconfig
WORKDIR /tmp
RUN rm -rf fswatch*

# Install npm
RUN curl -L https://npmjs.org/install.sh | sh
RUN npm install -g npm

# Add gosu for our user ID magic
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture).asc" \
    && gpg --verify /usr/local/bin/gosu.asc \
    && rm /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu

# Install npm-recursive-install for merging of package.json dependencies
RUN npm install -g recursive-install

# Create an unpriv user for node to run as
RUN groupadd -r node
RUN useradd --no-log-init -r -u $UID -g node node
RUN cp -rT /etc/skel /home/node
RUN chown -R node:node /home/node
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Make our source directory and chown it to the new user
RUN mkdir /app
RUN chown node:node /app

USER node
WORKDIR /app

# Note that the docker build context needs to be in the parent directory of this file
COPY --chown=node:node Server/src/package.json /app/package.json
RUN npm install --force

# Now copy all of the src into /app
# Note that the docker build context needs to be in the parent directory of this file
COPY --chown=node:node Server/src/ /app

RUN export BIND_IP=0.0.0.0
EXPOSE 6006

# Drop back to root. The docker entrypoint will drop to node user privileges
USER root

# For `docker run CONTAINER_ID`
COPY Server/docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
