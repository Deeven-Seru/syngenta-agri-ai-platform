"""
RAG Service — Grounded Agricultural Answers
- Uses MongoDB Atlas Vector Search for retrieval.
- Uses Groq for low-latency conversational generation.
"""
from groq import Groq
from google import genai
from config import get_settings
from database import col_knowledge_vectors, col_growers
import structlog

logger = structlog.get_logger()

async def get_embedding(text: str):
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    try:
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=[text]
        )
        if not response or not response.embeddings:
            logger.error("Embedding generation returned empty response")
            return None
        return response.embeddings[0].values
    except Exception as e:
        logger.error("Embedding generation failed", error=str(e))
        return None

async def search_knowledge(query_embedding: list[float], district: str, grower_id: str):
    """
    Execute Atlas Vector Search.
    Filter for global product data OR local district data.
    
    ATLAS INDEX CONFIG (JSON):
    {
      "fields": [
        {
          "type": "vector",
          "path": "embedding",
          "numDimensions": 768,
          "similarity": "cosine"
        },
        {
          "type": "filter",
          "path": "metadata.type"
        },
        {
          "type": "filter",
          "path": "metadata.district"
        }
      ]
    }
    """
    if query_embedding is None:
        return []

    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index", # User must name their index this
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": 5,
                "filter": {
                    "$or": [
                        {"metadata.type": "product"},
                        {"metadata.district": district}
                    ]
                }
            }
        },
        {
            "$project": {
                "text_content": 1,
                "score": {"$meta": "vectorSearchScore"},
                "metadata": 1
            }
        }
    ]
    
    try:
        cursor = col_knowledge_vectors().aggregate(pipeline)
        results = await cursor.to_list(length=5)
        logger.debug("Vector search completed", result_count=len(results) if results else 0)
        return results or []
    except Exception as e:
        logger.error("Vector search failed", error=str(e))
        # Fallback to a simple keyword search or empty list if index not ready
        return []

async def generate_grounded_answer(phone_number: str, question: str) -> str:
    settings = get_settings()
    groq_client = Groq(api_key=settings.groq_api_key)
    
    # Normalize phone: strip '+' and 'whatsapp:'
    clean_phone = phone_number.replace("whatsapp:", "").replace("+", "")
    
    # 1. Identify Grower
    grower = await col_growers().find_one({"_id": clean_phone}) 
    if not grower:
        grower = await col_growers().find_one({"phone": clean_phone})
        # If still not found, try with the original + (some DBs store with +)
        if not grower and not phone_number.startswith("whatsapp:"):
             grower = await col_growers().find_one({"_id": phone_number}) or await col_growers().find_one({"phone": phone_number})
        
    grower_context = ""
    district = "unknown"
    if grower:
        district = grower.get("district", "unknown")
        crop = grower.get("primary_crop", "unknown")
        stage = grower.get("crop_calendar", {}).get("current_stage", "unknown")
        grower_context = f"The farmer is growing {crop}, currently at the {stage} stage in {district} district."
    
    # 2. Vector Search
    embedding = await get_embedding(question)
    g_id = grower.get("_id") if grower else "unknown"
    search_results = await search_knowledge(embedding, district, g_id)
    
    context_text = "\n".join([r.get("text_content", "") for r in search_results if r])
    
    # 3. Prompt Groq
    prompt = f"""You are a helpful Syngenta India agricultural assistant.
You are speaking to a farmer on a voice call or chat.

GROWER CONTEXT:
{grower_context}

RELEVANT KNOWLEDGE (Grounded Facts):
{context_text}

USER QUESTION:
{question}

INSTRUCTIONS:
1. Answer the question using ONLY the Grounded Facts and Grower Context provided.
2. If you don't know the answer, say you will connect them to a representative.
3. Keep the answer concise (under 3 sentences) as it will be spoken.
4. Respond in the language the user used (usually Hindi, Marathi, or English).
5. Be polite and professional.
"""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional Syngenta Agri-AI assistant."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile", 
            temperature=0.2,
        )
        answer = chat_completion.choices[0].message.content
        return answer or "I am sorry, I am unable to generate a response at the moment. Please try again later."
    except Exception as e:
        logger.error("Groq generation failed", error=str(e))
        return "I apologize, but I am having trouble connecting to my knowledge base. Please call us back in a few minutes."
