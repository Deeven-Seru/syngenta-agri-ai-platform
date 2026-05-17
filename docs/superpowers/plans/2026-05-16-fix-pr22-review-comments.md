# PR #22 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve critical bugs, security risks, and performance bottlenecks identified in the review of PR #22.

**Architecture:** Update FastAPI routers and utility scripts to handle async operations correctly, avoid N+1 queries, ensure secure Twilio communication, and use valid Motor driver methods.

**Tech Stack:** FastAPI, Motor (MongoDB), Twilio SDK, Python 3.12.

---

### Task 1: Fix `backend/routers/campaigns.py`

**Files:**
- Modify: `backend/routers/campaigns.py`

- [ ] **Step 1: Update imports**
Add `import asyncio` and `from datetime import datetime, timezone`.

- [ ] **Step 2: Fix `to_list(length=None)` and N+1 queries in `dispatch_twilio_messages`**
Update `dispatch_twilio_messages` to use `length=len(grower_ids)` and ensure blocking calls are wrapped in `asyncio.to_thread`. Use `datetime.now(timezone.utc)` instead of `utcnow()`.

- [ ] **Step 3: Fix `to_list(length=None)` in `launch_campaign`**
Update `launch_campaign` to use a reasonable upper bound for `to_list`.

### Task 2: Fix Twilio Signature Validation

**Files:**
- Modify: `backend/routers/voice.py`
- Modify: `backend/routers/whatsapp.py`

- [ ] **Step 1: Enforce validation in `backend/routers/voice.py`**
Uncomment the `HTTPException` and ensure it's enforced when `settings.environment == "production"`.

- [ ] **Step 2: Enforce validation in `backend/routers/whatsapp.py`**
Implement strict validation enforcement for production.

### Task 3: Fix `backend/scripts/vectorize_knowledge.py`

**Files:**
- Modify: `backend/scripts/vectorize_knowledge.py`

- [ ] **Step 1: Fix `to_list(length=None)`**
Update `vectorize_inventory` to use a specific length (e.g., 5000) instead of `None`.

---

## Self-Review
1. **Spec coverage:** All review comments from PR #22 are addressed.
2. **Placeholder scan:** No placeholders.
3. **Type consistency:** Using consistent patterns for `asyncio.to_thread` and `to_list`.
