# Activate System Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable 'Weather Live', 'Grower Segments', and 'Model Scopes' features in the frontend by creating missing pages and updating routing.

**Architecture:** Extend the existing React SPA with new page components, update central routing in `App.tsx`, and ensure seamless data flow from existing backend endpoints.

**Tech Stack:** React 19, Vite, TypeScript, Recharts, Lucide Icons, FastAPI.

---

### Task 1: Update Routing and Sidebar in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Expand Page type and NAV constants**
Update `Page` type and add IDs to `SYS` items.

- [ ] **Step 2: Update sidebar rendering**
Remove hardcoded opacity and add `onClick` handlers to `SYS` items.

- [ ] **Step 3: Update main content switch**
Add conditional rendering for the new pages.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/App.tsx
git commit -m "feat: enable routing and sidebar for system views"
```

---

### Task 2: Implement WeatherLive Page

**Files:**
- Create: `frontend/src/pages/WeatherLive.tsx`

- [ ] **Step 1: Create WeatherLive component**
Fetch data from `api.getIndiaSummary()` and display risk cards and district weather.

- [ ] **Step 2: Commit**
```bash
git add frontend/src/pages/WeatherLive.tsx
git commit -m "feat: implement Weather Live dashboard"
```

---

### Task 3: Implement GrowerSegments Page

**Files:**
- Create: `frontend/src/pages/GrowerSegments.tsx`

- [ ] **Step 1: Create GrowerSegments component**
Fetch data from `api.getSegments()` and display aggregation charts/tables.

- [ ] **Step 2: Commit**
```bash
git add frontend/src/pages/GrowerSegments.tsx
git commit -m "feat: implement Grower Segments analytics"
```

---

### Task 4: Implement ModelScopes Page

**Files:**
- Create: `frontend/src/pages/ModelScopes.tsx`

- [ ] **Step 1: Create ModelScopes component**
Display model performance metrics (XGBoost) and scoring distributions.

- [ ] **Step 2: Commit**
```bash
git add frontend/src/pages/ModelScopes.tsx
git commit -m "feat: implement Model Scopes monitoring"
```

---

### Task 5: Final Verification and PR Preparation

- [ ] **Step 1: Run frontend build**
Verify no TypeScript or linting errors.

- [ ] **Step 2: Final Review**
Ensure all pages load correctly and data is dynamic.

- [ ] **Step 3: Push and PR**
Push the branch and prepare for PR review.
