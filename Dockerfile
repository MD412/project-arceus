# Multi-stage build for Pokemon Card Worker
# Optimized for ML dependencies and Render deployment

# Stage 1: Builder - Install dependencies
FROM python:3.11-slim as builder

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    git \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY worker/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Stage 2: Runtime - Minimal image with only what's needed
FROM python:3.11-slim

# Install runtime system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy worker code
COPY worker/worker.py worker/clip_lookup.py worker/config.py worker/openclip_embedder.py worker/retrieval_v2.py ./
COPY worker/__init__.py ./

# Set cache directory for CLIP model weights
ENV XDG_CACHE_HOME=/cache \
    OPENCLIP_CACHE_DIR=/cache/open_clip

# Pre-download CLIP model during build (prevents runtime download failures)
# Uses LAION checkpoint (not OpenAI) for ViT-B-32-quickgelu model
# This downloads ~1.6GB model into the image cache
RUN mkdir -p /cache/open_clip && python - <<'PY'
import os, open_clip
cache_dir = os.getenv("OPENCLIP_CACHE_DIR", "/cache/open_clip")
os.makedirs(cache_dir, exist_ok=True)
print("[BUILD] Downloading CLIP model to cache...")
# Download the exact model+checkpoint used at runtime
model, _, _ = open_clip.create_model_and_transforms(
    "ViT-B-32-quickgelu", 
    pretrained="laion2b_s34b_b79k",  # LAION checkpoint (NOT openai)
    cache_dir=cache_dir
)
print("[BUILD] CLIP model cached successfully")
PY

# Create output directory for logs
RUN mkdir -p /app/output

# Environment variables will be provided by Render
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check - verify Python and dependencies
RUN python -c "import ultralytics; import torch; import open_clip; print('Dependencies loaded successfully')"

# Run the worker
CMD ["python", "worker.py"]




