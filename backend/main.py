"""
FastAPI Main Application — Syngenta Agri-AI Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from database import connect_db, close_db
from routers import (
    campaigns,
    growers,
    analytics,
    weather,
    content,
    system,
    ticker,
)

from supertokens_python.framework.fastapi import get_middleware
from supertokens_python import get_all_cors_headers
from auth import init_supertokens

# Initialize SuperTokens
init_supertokens()

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🌱 Syngenta Agri-AI Platform starting...")
    await connect_db()

    yield

    # Shutdown
    await close_db()
    logger.info("Platform shutdown complete")


app = FastAPI(
    title="Syngenta Agri-AI Platform",
    description="AI-Powered Agricultural Marketing Intelligence System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# -----------------------------
# CORS CONFIGURATION
# -----------------------------
# IMPORTANT:
# - CORS must be added BEFORE SuperTokens middleware
# - SuperTokens middleware should be outermost
# - Use allow_headers=["*"] to avoid auth header issues
# -----------------------------

app.add_middleware(get_middleware())
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "anti-csrf"] + get_all_cors_headers(),
    expose_headers=["front-token", "anti-csrf"] + get_all_cors_headers(),
)


# -----------------------------
# ROUTERS
# -----------------------------

app.include_router(
    campaigns.router,
    prefix="/api/campaigns",
    tags=["Campaigns"],
)

app.include_router(
    growers.router,
    prefix="/api/growers",
    tags=["Growers"],
)

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
)

app.include_router(
    weather.router,
    prefix="/api/weather",
    tags=["Weather"],
)

app.include_router(
    content.router,
    prefix="/api/content",
    tags=["Content Generation"],
)

app.include_router(
    system.router,
    prefix="/api/system",
    tags=["System"],
)

app.include_router(
    ticker.router,
    prefix="/api",
    tags=["Real-Time Ticker"],
)

# -----------------------------
# HEALTH ROUTES
# -----------------------------


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Syngenta Agri-AI Platform",
        "status": "operational",
        "version": "1.0.0",
        "track": "AI-Powered Agricultural Marketing at Scale",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}