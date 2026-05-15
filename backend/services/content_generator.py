"""
Gemini Content Generation Service — google-genai SDK
- Generates personalized vernacular WhatsApp messages for each farmer
- Accounts for: language, crop, growth stage, product, weather context
"""
from google import genai
from google.genai import types
from config import get_settings
from typing import Optional

LANGUAGE_PROMPTS = {
    "Hindi": "Hindi",
    "Punjabi": "Punjabi (Gurmukhi script)",
    "Marathi": "Marathi",
    "Gujarati": "Gujarati",
    "Kannada": "Kannada",
    "Bengali": "Bengali",
}

PRODUCT_INFO = {
    "Tilt 250 EC": "broad-spectrum fungicide for wheat, controls rust and powdery mildew",
    "Score 250 EC": "systemic fungicide for mustard, controls Sclerotinia stem rot",
    "Amistar 250 SC": "premium fungicide for chickpea, controls Botrytis grey mold",
    "Kavach 75 WP": "contact fungicide for potato, controls late blight",
    "Actara 25 WG": "systemic insecticide for chickpea, controls pod borer",
    "Topik 15 WP": "selective herbicide for wheat, controls grassy weeds",
    "Axial 50 EC": "post-emergence herbicide for wheat and barley",
    "Alto 5 SC": "systemic fungicide, controls powdery mildew and rust",
    "Vibrance Integral": "seed treatment for improved germination and disease protection",
    "Movondo": "soil treatment to boost root health and yield",
}

_client = None


def get_client():
    global _client
    if _client is None:
        settings = get_settings()
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


_TEMPLATES = {
    "Hindi": ("किसान भाई, {crop} की फसल में {product} का छिड़काव अभी करें। नमी ज़्यादा है, फंगस का खतरा बढ़ा है। नज़दीकी डीलर से संपर्क करें। 📞", "Farmer brother, spray {product} on your {crop} crop now. Humidity is high, fungal risk has increased. Contact your nearest dealer."),
    "Punjabi": ("ਕਿਸਾਨ ਵੀਰ, {crop} ਦੀ ਫ਼ਸਲ 'ਤੇ {product} ਹੁਣੇ ਛਿੜਕੋ। ਨਮੀ ਵੱਧ ਹੈ, ਫ਼ਫ਼ੂੰਦੀ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਆਪਣੇ ਡੀਲਰ ਨੂੰ ਮਿਲੋ। 📞", "Farmer brother, spray {product} on your {crop} crop now. Humidity is high, fungal risk present. Meet your dealer."),
    "Marathi": ("शेतकरी बंधू, {crop} पिकावर {product} आत्ता फवारा. आर्द्रता जास्त आहे, बुरशीचा धोका आहे. जवळच्या विक्रेत्याला भेटा. 📞", "Farmer brother, spray {product} on your {crop} crop now. Humidity is high, fungal risk. Meet your nearest dealer."),
    "Gujarati": ("ખેડૂત ભાઈ, {crop} ના પાક પર {product} અત્યારે છાંટો. ભેજ વધુ છે, ફૂગનો ભય છે. નજીકના ડીલરને મળો. 📞", "Farmer brother, spray {product} on your {crop} crop now. High humidity, fungal risk. Meet your nearest dealer."),
    "Kannada": ("ರೈತ ಬಂಧು, {crop} ಬೆಳೆಗೆ {product} ಈಗಲೇ ಸಿಂಪಡಿಸಿ. ತೇವಾಂಶ ಹೆಚ್ಚಾಗಿದೆ, ಶಿಲೀಂಧ್ರ ಅಪಾಯವಿದೆ. ಹತ್ತಿರದ ಡೀಲರ್ ಅನ್ನು ಭೇಟಿ ಮಾಡಿ. 📞", "Farmer friend, spray {product} on your {crop} crop now. High humidity, fungal risk. Visit your nearest dealer."),
    "Bengali": ("কৃষক ভাই, {crop} ফসলে {product} এখনই স্প্রে করুন। আর্দ্রতা বেশি, ছত্রাকের ঝুঁকি আছে। কাছের ডিলারের সাথে যোগাযোগ করুন। 📞", "Farmer brother, spray {product} on your {crop} crop now. High humidity, fungal risk. Contact your nearest dealer."),
}


def _template_message(language: str, crop: str, product: str, crop_stage: Optional[str]) -> dict:
    native_tpl, english_tpl = _TEMPLATES.get(language, _TEMPLATES["Hindi"])
    native = native_tpl.format(crop=crop, product=product)
    english = english_tpl.format(crop=crop, product=product)
    return {
        "message_native": native,
        "message_english": english,
        "language": language,
        "character_count": len(native),
        "whatsapp_ready": True,
        "source": "template",  # flag so UI can show "AI temporarily unavailable"
    }


async def generate_whatsapp_message(
    grower_language: str,
    crop: str,
    product: str,
    crop_stage: Optional[str] = None,
    weather_context: Optional[str] = None,
    farmer_name: Optional[str] = None,
) -> dict:
    client = get_client()

    lang_label = LANGUAGE_PROMPTS.get(grower_language, "Hindi")
    product_desc = PRODUCT_INFO.get(product, product)
    stage_context = f"The crop is currently in the **{crop_stage}** stage." if crop_stage else ""
    weather_ctx = f"Current weather condition: {weather_context}." if weather_context else ""
    name_ctx = f"Address the farmer as 'Kisan bhai' (or equivalent in {lang_label})." if not farmer_name else f"The farmer's name is {farmer_name}."

    prompt = f"""You are a trusted agricultural advisor for Syngenta India.
Write a concise, friendly WhatsApp message to a {crop} farmer.

STRICT REQUIREMENTS:
1. Write ONLY in {lang_label}. Do NOT mix languages.
2. Keep it under 200 characters — WhatsApp farming messages must be short and scannable.
3. Mention the product: **{product}** ({product_desc}).
4. Reference the current crop situation naturally.
5. End with a clear call-to-action (call helpline / visit retailer / scan QR).
6. Use simple, village-level vocabulary — NOT technical jargon.
7. Sound like a friend who knows agriculture, not a corporate ad.

CONTEXT:
- Crop: {crop}
- Product: {product}
- {stage_context}
- {weather_ctx}
- {name_ctx}

FORMAT YOUR RESPONSE AS:
NATIVE_MESSAGE: [message in {lang_label}]
ENGLISH_TRANSLATION: [English translation]"""

    # Cascade through models — 2.5-flash preferred, fallback if overloaded/quota
    MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
    response = None
    last_error = None
    for model_id in MODELS:
        try:
            response = client.models.generate_content(
                model=model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=512,
                ),
            )
            break  # success
        except Exception as e:
            last_error = e
            continue

    if response is None:
        # All models failed — return a sensible pre-written template
        return _template_message(grower_language, crop, product, crop_stage)


    text = response.text.strip()

    # Strip <think>...</think> blocks emitted by 2.5-flash
    import re
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

    # Extract NATIVE_MESSAGE and ENGLISH_TRANSLATION
    native_match = re.search(r'NATIVE_MESSAGE:\s*(.+?)(?=ENGLISH_TRANSLATION:|$)', text, re.DOTALL)
    english_match = re.search(r'ENGLISH_TRANSLATION:\s*(.+?)$', text, re.DOTALL)

    native_msg = native_match.group(1).strip() if native_match else ""
    english_msg = english_match.group(1).strip() if english_match else ""

    # Strip any remaining bracket placeholders like [message in Hindi]
    native_msg = re.sub(r'^\[.*?\]$', '', native_msg).strip()
    english_msg = re.sub(r'^\[.*?\]$', '', english_msg).strip()

    if not native_msg or native_msg.startswith('['):
        # Model didn't follow format — use full response as the message
        native_msg = text
        english_msg = text

    return {
        "message_native": native_msg,
        "message_english": english_msg,
        "language": grower_language,
        "character_count": len(native_msg),
        "whatsapp_ready": len(native_msg) < 1000,
    }



async def generate_batch_messages(growers: list[dict]) -> list[dict]:
    results = []
    cache = {}
    for g in growers:
        key = f"{g.get('language')}:{g.get('primary_crop')}:{g.get('campaign_product')}:{g.get('crop_stage', '')}"
        if key not in cache:
            cache[key] = await generate_whatsapp_message(
                grower_language=g.get("language", "Hindi"),
                crop=g.get("primary_crop", "wheat"),
                product=g.get("campaign_product", "Tilt 250 EC"),
                crop_stage=g.get("crop_stage"),
                weather_context=g.get("weather_context"),
            )
        results.append({"grower_id": g.get("grower_id"), **cache[key]})
    return results


async def generate_campaign_summary(campaign_data: dict) -> str:
    client = get_client()
    prompt = f"""You are a marketing analyst for Syngenta India.
Write a 3-sentence executive summary of this campaign performance data.
Be specific about numbers. Suggest 1 concrete improvement action.
Campaign Data: {campaign_data}
Format: Plain text, no markdown, no bullet points."""
    response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    return response.text.strip()
