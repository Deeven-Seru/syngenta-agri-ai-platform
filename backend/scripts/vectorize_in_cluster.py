"""
Vectorize In-Cluster (Loop Ready)
- Processes chunks in safe batches.
- Can be run multiple times to steadily fill the knowledge base.
"""
import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from google import genai
from config import get_settings
from database import connect_db, close_db, col_knowledge_vectors

async def get_embeddings(texts: list[str]):
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=texts
    )
    return [e.values for e in response.embeddings]

async def process_batch(size=5):
    col = col_knowledge_vectors()
    query = {"embedding": {"$exists": False}}
    chunks = await col.find(query).limit(size).to_list(length=size)
    
    if not chunks:
        return False

    print(f"🚀 Vectorizing {len(chunks)} chunks...")
    texts = [c["text_content"] for c in chunks]
    embeddings = await get_embeddings(texts)
    
    for i, chunk in enumerate(chunks):
        await col.update_one({"_id": chunk["_id"]}, {"$set": {"embedding": embeddings[i]}})
    
    return True

async def main():
    await connect_db()
    
    # Run a few batches for this session
    for i in range(5):
        print(f"📦 Batch {i+1}...")
        success = await process_batch(size=5)
        if not success:
            print("✅ All done!")
            break
        await asyncio.sleep(15) # Safe sleep between batches
        
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
