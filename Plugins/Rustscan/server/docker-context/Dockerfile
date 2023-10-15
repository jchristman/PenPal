FROM rustscan/rustscan

USER root

# Install Python
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

# Copy the process_rustscan.py script into the container
COPY ./rustscan_scripts.toml /root/.rustscan_scripts.toml
RUN mkdir -p /root/.rustscan_scripts
COPY ./process_rustscan.py /root/.rustscan_scripts/process_rustscan.py
RUN chmod +x /root/.rustscan_scripts/process_rustscan.py

# Set the working directory to /working
WORKDIR /working

# Specify the entry point for the container
ENTRYPOINT ["sh", "-c"]
