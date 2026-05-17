"""Real-time ticker WebSocket endpoint"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from database import col_growers, col_whatsapp_log, col_campaigns
from services.weather_service import get_india_agricultural_weather_summary

router = APIRouter()


async def get_ticker_data() -> dict:
    """Fetch live KPIs for the executive ticker."""
    try:
        total_growers = await col_growers().count_documents({})
        total_messages = await col_whatsapp_log().count_documents({})
        opened = await col_whatsapp_log().count_documents({"opened": True})
        total_campaigns = await col_campaigns().count_documents({})

        open_rate = round(100 * opened / total_messages, 1) if total_messages else 0

        # Estimate revenue protected: avg $7,083/grower engaged
        revenue_m = round((total_growers * 7083) / 1_000_000, 1)

        # Weather threats via Meteoblue
        try:
            weather = await get_india_agricultural_weather_summary()
            threat_count = weather.get("high_risk_districts", 0)
        except Exception:
            threat_count = "--"

        return {
            "protected_revenue": f"${revenue_m}M",
            "engagement_pulse": f"{total_messages:,}",
            "ai_confidence": f"{open_rate}%",
            "weather_threats": threat_count,
            "total_growers": total_growers,
            "total_campaigns": total_campaigns,
        }
    except Exception as e:
        return {"error": str(e)}


@router.websocket("/ws/ticker")
async def ticker_websocket(websocket: WebSocket):
    """Push live ticker data every 30 seconds."""
    await websocket.accept()
    try:
        while True:
            data = await get_ticker_data()
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


@router.get("/ticker")
async def get_ticker():
    """REST fallback for ticker data (used on initial page load)."""
    return await get_ticker_data()
