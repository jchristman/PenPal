export default `FROM debian:buster-slim

# Install dependencies
RUN apt-get update
RUN apt-get install -y git build-essential curl wget libpcap-dev

# Clone masscan git repo
RUN git clone https://github.com/robertdavidgraham/masscan /opt/masscan
WORKDIR /opt/masscan

# Make masscan
RUN make -j

# Copy binary
RUN cp /opt/masscan/bin/masscan /usr/local/bin

# Launch Bash
CMD ["/bin/bash"]`;
