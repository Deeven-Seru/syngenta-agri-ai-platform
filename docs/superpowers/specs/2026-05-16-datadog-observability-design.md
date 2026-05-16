# Design Spec: Datadog Observability Integration

**Date:** 2026-05-16
**Status:** Approved
**Topic:** Monitoring & Observability

## 1. Objective
Implement a comprehensive monitoring and observability stack using Datadog to ensure the reliability, performance, and scalability of the Syngenta Agri-AI Marketing Orchestration Platform.

## 2. Architecture
The integration follows Approach A (Datadog SDK-based instrumentation) for maximum depth and ease of deployment on serverless infrastructure.

### 2.1 Backend (FastAPI)
- **Tooling:** `dd-trace-py` (Python SDK).
- **Instrumentation:** 
    - Auto-instrumentation via `ddtrace-run` in the container entrypoint.
    - Manual spans for critical AI logic (Gemini 2.5 Flash calls).
    - Integration with `motor` (MongoDB) and `httpx`.
- **Log Correlation:** Configure `structlog` to include `dd.trace_id` and `dd.span_id` in JSON output for seamless log-to-trace navigation.

### 2.2 Frontend (React/Vite)
- **Tooling:** `@datadog/browser-rum`.
- **Integration:** Initialize in `src/main.tsx`.
- **Features:**
    - Real User Monitoring (RUM).
    - Session Replays for error reproduction.
    - Error tracking and performance vitals.

### 2.3 Cloud Infrastructure (Google Cloud Run)
- **Configuration:** Use environment variables for configuration.
- **Secrets:** `DD_API_KEY` stored in GCP Secret Manager and injected at runtime.
- **Service Tags:** Standard tags: `service:syngenta-backend`, `env:production`, `version:1.x.x`.

## 3. Implementation Plan
1. **Dependency Update:** Add `ddtrace` to `backend/requirements.txt` and `@datadog/browser-rum` to `frontend/package.json`.
2. **Backend Config:** Update `backend/main.py` and `Dockerfile`.
3. **Frontend Config:** Initialize RUM in `frontend/src/main.tsx`.
4. **Environment Setup:** Configure Datadog API keys in the deployment pipeline.

## 4. Success Criteria
- Traces visible in Datadog APM for all FastAPI endpoints.
- MongoDB query latency tracked per endpoint.
- Frontend errors automatically logged in Datadog RUM.
- End-to-end trace correlation (Frontend -> Backend -> DB).
