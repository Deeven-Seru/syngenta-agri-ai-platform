"""
Meteoblue Weather Service
- Fetches real-time weather data for India agricultural districts
- Returns weather context for campaign timing decisions
"""
import httpx
from config import get_settings
from typing import Optional
import asyncio

# Major Indian agricultural district lat/lon centroids
DISTRICT_COORDS = {
    "Bharatpur": (27.2152, 77.4934),
    "Patna": (25.5941, 85.1376),
    "Jaipur": (26.9124, 75.7873),
    "Ludhiana": (30.9010, 75.8573),
    "Amritsar": (31.6340, 74.8723),
    "Nagpur": (21.1458, 79.0882),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Surat": (21.1702, 72.8311),
    "Varanasi": (25.3176, 82.9739),
    "Agra": (27.1767, 78.0081),
    "Kanpur": (26.4499, 80.3319),
    "Bhopal": (23.2599, 77.4126),
    "Indore": (22.7196, 75.8577),
    "Hyderabad": (17.3850, 78.4867),
    "Bengaluru": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Delhi": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777),
}

# Weather risk thresholds for agricultural advisory
RISK_THRESHOLDS = {
    "high_humidity": 80,      # % — fungal disease risk
    "low_temp": 5,            # °C — frost risk  
    "high_temp": 40,          # °C — heat stress
    "heavy_rain": 20,         # mm/day — field access issues
    "drought": 2,             # mm/week — irrigation alert
}


async def get_district_weather(district: str, lat: float = None, lon: float = None) -> dict:
    """
    Fetch current weather for a district from Meteoblue API.
    Returns weather data + agricultural risk flags.
    """
    settings = get_settings()

    # Get coordinates
    if lat is None or lon is None:
        coords = DISTRICT_COORDS.get(district)
        if not coords:
            return {"error": f"Unknown district: {district}", "district": district}
        lat, lon = coords

    url = (
        f"https://my.meteoblue.com/packages/current"
        f"?lat={lat}&lon={lon}"
        f"&apikey={settings.meteoblue_api_key}"
        f"&format=json"
        f"&temperature=C"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        return {"error": f"API error: {e.response.status_code}", "district": district}
    except Exception as e:
        return {"error": str(e), "district": district}

    # Extract relevant fields
    current = data.get("data_current", {})
    temp = current.get("temperature", None)
    humidity = current.get("relativehumidity", None)
    precip = current.get("precipitation", None)
    wind_speed = current.get("windspeed", None)
    condition = current.get("pictocode", None)

    # Determine agricultural risk
    risks = []
    campaign_timing_advice = "optimal"

    if humidity and humidity > RISK_THRESHOLDS["high_humidity"]:
        risks.append("high_fungal_risk")
        campaign_timing_advice = "urgent"  # Fungicide message NOW

    if temp and temp < RISK_THRESHOLDS["low_temp"]:
        risks.append("frost_risk")
        campaign_timing_advice = "urgent"

    if temp and temp > RISK_THRESHOLDS["high_temp"]:
        risks.append("heat_stress")

    if precip and precip > RISK_THRESHOLDS["heavy_rain"]:
        risks.append("heavy_rain")
        campaign_timing_advice = "delay"  # Farmer busy dealing with rain

    weather_description = _describe_weather(temp, humidity, precip, risks)

    return {
        "district": district,
        "lat": lat,
        "lon": lon,
        "temperature_c": temp,
        "humidity_pct": humidity,
        "precipitation_mm": precip,
        "wind_speed_kmh": wind_speed,
        "risks": risks,
        "campaign_timing": campaign_timing_advice,
        "weather_context": weather_description,
        "raw": current,
    }


async def get_bulk_district_weather(districts: list[str]) -> dict:
    """Fetch weather for multiple districts concurrently."""
    tasks = [get_district_weather(d) for d in districts]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    weather_map = {}
    for district, result in zip(districts, results):
        if isinstance(result, Exception):
            weather_map[district] = {"error": str(result)}
        else:
            weather_map[district] = result

    return weather_map


def _describe_weather(temp, humidity, precip, risks) -> str:
    """Convert weather data to a natural language context string for Gemini."""
    parts = []

    if temp is not None:
        if temp < 10:
            parts.append(f"cold weather ({temp:.0f}°C)")
        elif temp > 38:
            parts.append(f"heat wave conditions ({temp:.0f}°C)")
        else:
            parts.append(f"{temp:.0f}°C temperature")

    if humidity is not None and humidity > 75:
        parts.append(f"high humidity ({humidity:.0f}%) increasing disease risk")

    if precip is not None and precip > 5:
        parts.append(f"recent rainfall ({precip:.1f}mm)")

    if "high_fungal_risk" in risks:
        parts.append("elevated fungal disease risk")

    return ", ".join(parts) if parts else "normal weather conditions"


async def get_india_agricultural_weather_summary() -> dict:
    """
    Get weather summary for all major Indian agricultural districts.
    Used for the dashboard heat map.
    """
    all_districts = list(DISTRICT_COORDS.keys())
    weather_map = await get_bulk_district_weather(all_districts)

    # Summarize risk distribution
    urgent_districts = [
        d for d, w in weather_map.items()
        if w.get("campaign_timing") == "urgent"
    ]
    delay_districts = [
        d for d, w in weather_map.items()
        if w.get("campaign_timing") == "delay"
    ]

    return {
        "districts": weather_map,
        "urgent_campaign_districts": urgent_districts,
        "delay_campaign_districts": delay_districts,
        "total_districts": len(all_districts),
    }
