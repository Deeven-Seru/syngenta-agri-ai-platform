import motor.motor_asyncio
import asyncio
import certifi
import os
from dotenv import load_dotenv

load_dotenv('.env')
uri = os.getenv('MONGODB_URI')
db_name = os.getenv('MONGODB_DB_NAME')
client = motor.motor_asyncio.AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
db = client[db_name]

async def check():
    collections = await db.list_collection_names()
    print(f"Collections in {db_name}:", collections)
    for col in collections:
        count = await db[col].count_documents({})
        print(f"{col}: {count} documents")

asyncio.run(check())
