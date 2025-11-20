# AutoRecon Subdomain Enumeration Tools Container
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    jq \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /tools

# Install tools using pre-compiled amd64 binaries (works on Apple Silicon via Rosetta)
# Install subfinder
RUN wget -q https://github.com/projectdiscovery/subfinder/releases/download/v2.6.3/subfinder_2.6.3_linux_amd64.zip && \
    unzip subfinder_2.6.3_linux_amd64.zip && \
    chmod +x subfinder && \
    mv subfinder /usr/local/bin/ && \
    rm subfinder_2.6.3_linux_amd64.zip

# Install assetfinder (build from source for architecture compatibility)
RUN apt-get update && apt-get install -y golang-go && \
    go install github.com/tomnomnom/assetfinder@latest && \
    mv /root/go/bin/assetfinder /usr/local/bin/ && \
    apt-get remove -y golang-go && apt-get autoremove -y && rm -rf /root/go

# Install amass
RUN wget -q https://github.com/owasp-amass/amass/releases/download/v5.0.1/amass_linux_amd64.tar.gz && \
    tar -xzf amass_linux_amd64.tar.gz && \
    chmod +x amass_linux_amd64/amass && \
    mv amass_linux_amd64/amass /usr/local/bin/ && \
    rm -rf amass_linux_amd64.tar.gz amass_linux_amd64/

# Install findomain
RUN wget -q https://github.com/findomain/findomain/releases/download/10.0.1/findomain-linux.zip && \
    unzip findomain-linux.zip && \
    chmod +x findomain && \
    mv findomain /usr/local/bin/ && \
    rm findomain-linux.zip

# Verify all tools are installed and executable
RUN which findomain && which subfinder && which amass && which assetfinder

# Create a simple entrypoint script for testing
RUN echo '#!/bin/bash\n\
echo "AutoRecon Tools Container"\n\
echo "Available tools: findomain, subfinder, amass, assetfinder"\n\
echo "Usage: docker run autorecon <tool> [args...]"\n\
echo ""\n\
if [ $# -eq 0 ]; then\n\
    echo "Run with a tool name to execute it"\n\
    exit 1\n\
fi\n\
\n\
TOOL=$1\n\
shift\n\
\n\
case $TOOL in\n\
    findomain|subfinder|amass)\n\
        exec "$TOOL" "$@"\n\
        ;;\n\
    assetfinder)\n\
        # Assetfinder needs shell redirection support\n\
        exec "$TOOL" "$@"\n\
        ;;\n\
    sh)\n\
        # Allow shell commands for complex operations\n\
        exec bash "$@"\n\
        ;;\n\
    crtsh)\n\
        # Handle crt.sh queries directly with curl\n\
        exec curl "$@"\n\
        ;;\n\
    *)\n\
        echo "Unknown tool: $TOOL"\n\
        echo "Available tools: findomain, subfinder, amass, assetfinder, sh, crtsh"\n\
        exit 1\n\
        ;;\n\
esac' > /tools/entrypoint.sh && chmod +x /tools/entrypoint.sh

ENTRYPOINT ["/tools/entrypoint.sh"]
