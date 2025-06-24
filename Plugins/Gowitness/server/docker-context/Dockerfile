# Use the official Gowitness image
FROM ghcr.io/sensepost/gowitness:latest

# Set working directory
WORKDIR /app

# Create directories for input/output
RUN mkdir -p /app/screenshots /app/input

# Default entrypoint will be the gowitness command
ENTRYPOINT ["gowitness"] 