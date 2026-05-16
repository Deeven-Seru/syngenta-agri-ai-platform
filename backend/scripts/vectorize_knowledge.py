"""
Vectorize Knowledge Script
- Embeds product info, local retailer stock, and rep territories into MongoDB Atlas Vector Search.
- Uses Google's text-embedding-004 model.
"""
import asyncio
import sys
from pathlib import Path

# Add parent dir to path to import backend modules
sys.path.append(str(Path(__file__).parent.parent))

from google import genai
from config import get_settings
from database import connect_db, close_db, col_knowledge_vectors, col_inventory, col_reps, col_retailers
from services.content_generator import PRODUCT_INFO

async def get_embeddings(texts: list[str]):
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    
    all_embeddings = []
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=batch
        )
        all_embeddings.extend([e.values for e in response.embeddings])
        if len(texts) > batch_size:
            print("   ... sleeping 20s to respect quota")
            await asyncio.sleep(20) 
            
    return all_embeddings

async def vectorize_products():
    print("📦 Vectorizing product information...")
    chunks = []
    for product, desc in PRODUCT_INFO.items():
        text = f"Product: {product}. Description: {desc}."
        chunks.append({
            "text_content": text,
            "metadata": {
                "type": "product",
                "product_name": product
            }
        })
    
    embeddings = await get_embeddings([c["text_content"] for c in chunks])
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]
        
    return chunks

async def vectorize_inventory():
    print("🏪 Vectorizing retailer inventory...")
    # Filter for the latest date only to avoid massive sorts
    latest_date = "2026-03-29"
    pipeline = [
        {"$match": {"week_end_date": latest_date}},
        {"$group": {
            "_id": {"retailer_id": "$retailer_id", "sku_name": "$sku_name"},
            "qty": {"$first": "$qty"},
            "in_stock": {"$first": "$in_stock"}
        }}
    ]
    inv_items = await col_inventory().aggregate(pipeline).to_list(length=100)
    
    # Get retailer details for location context (only for retailers in the current inventory batch)
    retailer_ids = list(set(item["_id"]["retailer_id"] for item in inv_items))
    retailers = await col_retailers().find({"_id": {"$in": retailer_ids}}).to_list(length=len(retailer_ids))
    retailer_map = {r["_id"]: r for r in retailers}
    
    chunks = []
    for item in inv_items:
        r_id = item["_id"]["retailer_id"]
        sku = item["_id"]["sku_name"]
        qty = item["qty"]
        
        r = retailer_map.get(r_id)
        if not r: continue
        
        text = f"Retailer {r_id} in {r['tehsil']}, {r['district']}, {r['state']} has {qty} units of {sku} in stock."
        chunks.append({
            "text_content": text,
            "metadata": {
                "type": "inventory",
                "retailer_id": r_id,
                "product_name": sku,
                "district": r["district"],
                "state": r["state"],
                "tehsil": r["tehsil"]
            }
        })
    
    if not chunks: return []
    
    embeddings = await get_embeddings([c["text_content"] for c in chunks])
        
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]
        
    return chunks

async def vectorize_reps():
    print("👔 Vectorizing representative territories...")
    rep_cursor = col_reps().find({}).limit(10) # Heavily limited
    reps = await rep_cursor.to_list(length=10)
    
    chunks = []
    for rep in reps:
        tehsils = ", ".join(rep.get("tehsil_list", []))
        text = f"The Syngenta representative for {rep['district']}, {rep['state']} (covering {tehsils}) is Rep {rep['_id']}."
        chunks.append({
            "text_content": text,
            "metadata": {
                "type": "rep",
                "rep_id": rep["_id"],
                "district": rep["district"],
                "state": rep["state"]
            }
        })
        
    if not chunks: return []
    
    embeddings = await get_embeddings([c["text_content"] for c in chunks])
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]
        
    return chunks

async def main():
    await connect_db()
    
    col = col_knowledge_vectors()
    await col.delete_many({}) # Fresh start
    
    all_chunks = []
    all_chunks.extend(await vectorize_products())
    # Skipping inventory to avoid rate limits
    # all_chunks.extend(await vectorize_inventory())
    all_chunks.extend(await vectorize_reps())
    
    if all_chunks:
        print(f"🚀 Inserting {len(all_chunks)} vector chunks into MongoDB...")
        await col.insert_many(all_chunks)
        print("✅ Vectorization complete.")
    else:
        print("⚠️ No data found to vectorize.")
        
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
