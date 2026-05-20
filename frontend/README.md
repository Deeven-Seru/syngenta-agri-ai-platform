# Frontend

React 19 + Vite dashboard for the Twig-life Agri-AI Platform.

## Run locally

```bash
npm install
npm run dev
```

The app runs on Vite's default local port unless overridden.

## Backend connection

Set `VITE_API_URL` to point at the backend API.

Example:

```bash
VITE_API_URL=https://your-backend-domain npm run dev
```

If `VITE_API_URL` is not set, the frontend falls back to `http://localhost:8080`.

## Structure

- `src/pages/`: top-level dashboard views.
- `src/api.ts`: backend API client wrapper.
- `src/icons.tsx`: shared icon components.
- `src/assets/`: static app assets.

## Notes

- This frontend mixes live backend-driven views with some demo-oriented presentation metrics.
- Keep feature-specific logic in `src/pages/` and shared transport logic in `src/api.ts`.
