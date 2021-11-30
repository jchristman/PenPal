FROM debian:bullseye-slim

ARG UID=1000
ARG NODE_VERSION=17
ARG MONGO_VERSION=5.0
ARG GOSU_VERSION=1.14
ARG PLATFORM=x86_64

SHELL ["/bin/bash", "-c"]

RUN apt-get update
RUN apt-get install curl -y

# Install node.js and Mongo
RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

# Mongo wants to run systemctl, so link /bin/true to always return 0
RUN ln -s /bin/true /bin/systemctl

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
    sudo git-core build-essential openssl libssl-dev \
    procps entr nodejs python file lsof \
    netcat ca-certificates gnupg lsb-release

# Install docker in docker....
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
          https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Add gosu for our user ID magic
RUN gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-$(dpkg --print-architecture).asc" \
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

# Drop privs to the node user
USER node

# Install npm-recursive-install for merging of package.json dependencies
RUN sudo npm install -g recursive-install

# Now install PenPal dependencies
# Make /app the working directory
WORKDIR /app

# Now copy all of the src into /app
COPY --chown=node:node src/ /app
RUN npm install

# Export ports
RUN export BIND_IP=0.0.0.0
EXPOSE 3000
EXPOSE 9229

# Drop back to root. The docker entrypoint will drop to node user privileges
USER root

# For `docker run CONTAINER_ID`
COPY ./docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
