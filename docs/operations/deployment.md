# Deployment Guide

This repo is structured for:

- frontend on GitHub Pages
- backend on Render

## Frontend

The frontend deploys from `.github/workflows/deploy-frontend.yml`.

Required GitHub Actions secret:

- `VITE_API_URL`: public backend base URL, for example `https://test-backend.onrender.com`

The workflow builds `frontend/` and publishes it to GitHub Pages. The Vite base path is set from the repository name automatically.

## Backend

The backend is deploy-ready through `render.yaml`.

Required Render environment variables:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `METEOBLUE_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PHONE_NUMBER`

Optional:

- `APP_PORT`
- `PORT`
- `ENVIRONMENT`
- `LOG_LEVEL`

## Notes

- Do not expose MongoDB, Gemini, Groq, or Twilio secrets to GitHub Pages.
- The frontend should only call the backend over HTTPS.
- After the backend is deployed, copy its public URL into the GitHub secret `VITE_API_URL`.
