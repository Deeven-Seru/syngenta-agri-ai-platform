FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .
RUN chmod +x startup.sh

# Ensure ml directory exists and copy artifacts
RUN mkdir -p ml
COPY ml/receptivity_model.pkl ./ml/ 2>/dev/null || true
COPY ml/label_encoders.pkl ./ml/ 2>/dev/null || true

# Set environment
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["./startup.sh"]
