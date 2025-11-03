# InfoVerif.org - Production Dockerfile with Full C++ Runtime
FROM python:3.11-slim

# Install system dependencies INCLUDING full C++ runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    gcc \
    g++ \
    libstdc++6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for layer caching)
COPY api/requirements-lite.txt /app/api/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /app/api/requirements-lite.txt

# Copy application code
COPY . /app/

# Expose port
EXPOSE 8080

# Start command
WORKDIR /app/api
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

