FROM instrumentisto/nmap

USER root

# Install Python
ENV PYTHONUNBUFFERED=1
ENV PIP_BREAK_SYSTEM_PACKAGES=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN pip3 install --no-cache --upgrade pip setuptools

# Install jc dependencies and jc
RUN apk add gcc python3-dev musl-dev
RUN pip3 install jc

# Set the working directory to /working
WORKDIR /working

CMD ["nmap"]