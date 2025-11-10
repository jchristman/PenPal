# Use the official Nuclei image from ProjectDiscovery
FROM projectdiscovery/nuclei:latest

# Set working directory
WORKDIR /app

# Create directories for input/output
RUN mkdir -p /app/input /app/output

# Update nuclei templates on startup
RUN nuclei -update-templates

# Default entrypoint will be the nuclei command
ENTRYPOINT ["nuclei"]

