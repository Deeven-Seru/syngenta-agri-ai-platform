"""
Campaign decisioning helpers for Track 1.

These rules sit around the ML score so the prototype can explain timing,
channel, and segment choices in language a marketing or field team can trust.
"""

from __future__ import annotations

from collections import Counter
from typing import Any


def recommend_channel(device_type: str | None, score: float = 0, timing: str | None = None) -> str:
    """Choose the lowest-friction channel for the grower's device and urgency."""
    device = (device_type or "unknown").lower()
    if device == "smartphone":
        return "whatsapp"
    if device == "keypad":
        return "voice_call"
    return "retailer_or_rep_followup"


def timing_window(weather: dict[str, Any] | None) -> str:
    """Convert weather advice into an operational send window."""
    timing = (weather or {}).get("campaign_timing")
    if timing == "urgent":
        return "Send within 6 hours"
    if timing == "delay":
        return "Delay 24-48 hours and retry after rainfall"
    if (weather or {}).get("error"):
        return "Use default morning slot; weather unavailable"
    return "Send 7-9 AM local time"


def weather_signal(weather: dict[str, Any] | None) -> dict[str, Any]:
    """Normalize live weather into campaign-safe metadata."""
    weather = weather or {}
    timing = weather.get("campaign_timing") or ("unavailable" if weather.get("error") else "optimal")
    risks = weather.get("risks") if isinstance(weather.get("risks"), list) else []
    context = weather.get("weather_context") or weather.get("error") or "Weather signal unavailable"
    return {
        "campaign_timing": timing,
        "timing_window": timing_window(weather),
        "weather_context": context,
        "weather_risks": risks,
    }


def target_reasons(target: dict[str, Any], crop: str, product: str, weather: dict[str, Any] | None = None) -> list[str]:
    """Create concise explanations for why a grower belongs in this campaign."""
    reasons: list[str] = []
    score = float(target.get("receptivity_score") or 0)
    tier = target.get("receptivity_tier", "low")
    language = target.get("language") or "local language"
    device = target.get("device_type") or "unknown device"

    reasons.append(f"{tier.title()} ML receptivity score ({score * 100:.1f}%)")
    reasons.append(f"{language} creative variant matched to local language preference")

    if device == "smartphone":
        reasons.append("Smartphone user can receive rich WhatsApp creative")
    elif device == "keypad":
        reasons.append("Feature phone user needs voice/SMS-first outreach")
    else:
        reasons.append("Unknown device routed to assisted follow-up")

    if target.get("district"):
        reasons.append(f"{target['district']} localized for {crop} and {product}")

    risks = (weather or {}).get("risks") or []
    if "high_fungal_risk" in risks:
        reasons.append("High humidity raises disease-risk urgency")
    if "heavy_rain" in risks:
        reasons.append("Rain signal suggests delaying marketing push")

    return reasons[:5]


def enrich_target(target: dict[str, Any], crop: str, product: str, weather: dict[str, Any] | None = None) -> dict[str, Any]:
    """Attach campaign intelligence fields to a target row."""
    signal = weather_signal(weather)
    score = float(target.get("receptivity_score") or 0)
    channel = recommend_channel(target.get("device_type"), score, signal["campaign_timing"])
    return {
        **signal,
        "recommended_channel": channel,
        "decision_reasons": target_reasons(target, crop, product, weather),
    }


def channel_mix(targets: list[dict[str, Any]]) -> dict[str, int]:
    """Aggregate channel recommendations for campaign summaries."""
    counts = Counter(t.get("recommended_channel") or "unknown" for t in targets)
    return dict(counts)
