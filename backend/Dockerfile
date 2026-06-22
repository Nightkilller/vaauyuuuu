FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for compiling certain ML modules and LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application backend code
COPY . .

# Expose FastAPI server port
EXPOSE 8000

# Set host and port environments
ENV HOST=0.0.0.0
ENV PORT=8000

# Start FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
