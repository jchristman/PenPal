# Multi-stage build for Eyeballer
FROM python:3.9-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    file \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Download Eyeballer code
WORKDIR /app
RUN git clone https://github.com/BishopFox/eyeballer.git . || \
    (echo "Git clone failed, will download release instead" && mkdir -p /app)

# Download pretrained weights from GitHub releases
# Using the latest 3.0 release (tag is "3.0", not "v3.0")
RUN mkdir -p /app/weights && \
    wget --no-check-certificate \
         https://github.com/BishopFox/eyeballer/releases/download/3.0/bishop-fox-pretrained-v3.h5 \
         -O /app/weights/bishop-fox-pretrained-v3.h5 && \
    ls -lh /app/weights/bishop-fox-pretrained-v3.h5 && \
    file /app/weights/bishop-fox-pretrained-v3.h5 | grep -q "data" || \
    (echo "ERROR: Weights file download failed or file is corrupted" && exit 1)

# Pre-download TensorFlow/Keras weights (mobilenet) during build
# This prevents runtime downloads and speeds up execution
# Set KERAS_HOME to a location we can copy to final image
ENV KERAS_HOME=/root/.keras
RUN mkdir -p /root/.keras/models && \
    python3 -c "\
import os; \
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'; \
import tensorflow as tf; \
from tensorflow.keras.applications import MobileNet; \
print('Pre-downloading MobileNet weights...'); \
# Download the same MobileNet config that Eyeballer uses (1.0, 224, no top) \
model = MobileNet(alpha=1.0, depth_multiplier=1, include_top=False, weights='imagenet', input_shape=(224, 224, 3)); \
print('MobileNet weights downloaded successfully'); \
" && \
    echo "TensorFlow weights cached in /root/.keras/models"

# Final stage
FROM python:3.9-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy TensorFlow/Keras model cache (pre-downloaded weights)
COPY --from=builder /root/.keras /root/.keras

# Set KERAS_HOME so TensorFlow uses the cached weights
ENV KERAS_HOME=/root/.keras

# Copy Eyeballer code and weights
WORKDIR /app
COPY --from=builder /app /app

# If Eyeballer code wasn't cloned, download it now
RUN if [ ! -f "eyeballer.py" ]; then \
    git clone https://github.com/BishopFox/eyeballer.git /tmp/eyeballer && \
    cp -r /tmp/eyeballer/* /app/ && \
    rm -rf /tmp/eyeballer; \
    fi

# Ensure weights directory exists
RUN mkdir -p /app/weights

# Set working directory
WORKDIR /app

# Default command
ENTRYPOINT ["python3", "eyeballer.py"]


