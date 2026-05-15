#!/bin/bash
# startup.sh — runs on Cloud Run container start
# 1. Runs data ingestion if growers collection is empty
# 2. Starts the FastAPI server

set -e

echo "🚀 Syngenta Agri-AI Platform starting..."
echo "   GCP Project: ${GCP_PROJECT_ID}"
echo "   MongoDB DB:  ${MONGODB_DB_NAME}"

# Run ingestion check (idempotent — skips if data already loaded)
echo "📥 Checking if data ingestion is needed..."
python3 scripts/ingest_data.py --check-only 2>/dev/null || python3 scripts/ingest_data.py

echo "🌐 Starting FastAPI server on port ${PORT:-8080}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"
