import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services.campaign_intelligence import enrich_target, recommend_channel, weather_signal


class CampaignIntelligenceTest(unittest.TestCase):
    def test_recommend_channel_uses_whatsapp_for_smartphones(self):
        self.assertEqual(recommend_channel("smartphone", score=0.2, timing="optimal"), "whatsapp")

    def test_recommend_channel_uses_voice_for_keypad_growers(self):
        self.assertEqual(recommend_channel("keypad", score=0.02, timing="optimal"), "voice_call")

    def test_weather_signal_marks_unavailable_when_api_fails(self):
        signal = weather_signal({"error": "API unavailable", "district": "Delhi"})

        self.assertEqual(signal["campaign_timing"], "unavailable")
        self.assertEqual(signal["timing_window"], "Use default morning slot; weather unavailable")
        self.assertEqual(signal["weather_context"], "API unavailable")
        self.assertEqual(signal["weather_risks"], [])

    def test_enrich_target_explains_localized_campaign_decision(self):
        target = {
            "receptivity_score": 0.17,
            "receptivity_tier": "high",
            "language": "Hindi",
            "device_type": "smartphone",
            "district": "Bharatpur",
        }
        weather = {
            "campaign_timing": "urgent",
            "weather_context": "high humidity increasing disease risk",
            "risks": ["high_fungal_risk"],
        }

        enriched = enrich_target(target, "wheat", "Tilt 250 EC", weather)

        self.assertEqual(enriched["recommended_channel"], "whatsapp")
        self.assertEqual(enriched["campaign_timing"], "urgent")
        self.assertEqual(enriched["timing_window"], "Send within 6 hours")
        self.assertIn("high_fungal_risk", enriched["weather_risks"])
        self.assertTrue(any("High ML receptivity score" in reason for reason in enriched["decision_reasons"]))
        self.assertTrue(any("High humidity raises disease-risk urgency" in reason for reason in enriched["decision_reasons"]))


if __name__ == "__main__":
    unittest.main()
