"""
Data Ingestion Script: CSV files → MongoDB Atlas

Run once to load all Syngenta hackathon data into MongoDB.
Usage: python scripts/ingest_data.py --data-dir /path/to/dataset
"""
import asyncio
import csv
import json
import sys
import argparse
from pathlib import Path
from typing import Any

import motor.motor_asyncio
import certifi
from dotenv import load_dotenv

load_dotenv()

import os

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB_NAME", "syngenta_agri")

DATA_DIR = Path(os.getenv("DATA_DIR", "/Users/deeven/Developer/Syngenta_IITM_Hackathon_2026_dataset (1)"))


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest Syngenta hackathon CSV data into MongoDB.")
    parser.add_argument("--data-dir", type=Path, default=DATA_DIR)
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Exit 0 if growers data already exists, otherwise exit 1 without ingesting.",
    )
    return parser.parse_args()


def parse_bool(val: str) -> bool:
    return str(val).strip().lower() in ("true", "1", "yes")


def read_csv(fpath: Path) -> list[dict]:
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        return list(csv.DictReader(f))


async def ingest_growers(db, rows: list[dict]):
    """Parse crop calendar JSON, coerce types, upsert."""
    docs = []
    for r in rows:
        try:
            crop_cal = json.loads(r["grower_crop_calendar"])
        except Exception:
            crop_cal = {}
        phone = (
            r.get("phone")
            or r.get("grower_phone")
            or r.get("phone_number")
            or r.get("mobile")
            or r["grower_id"]
        )
        docs.append({
            "_id": r["grower_id"],
            "phone": str(phone),
            "state": r["state"],
            "district": r["district"],
            "tehsil": r["tehsil"],
            "language": r["language"],
            "device_type": r["device_type"],
            "grower_age": int(r["grower_age"]) if r["grower_age"] else None,
            "gender": r["gender"],
            "crop_calendar": crop_cal,
            "primary_crop": crop_cal.get("crop", ""),
            "product_scan": parse_bool(r["product_scan"]),
            "product_name": r["product_name"],
            "product_scan_datetime": r["product_scan_datetime"],
            "farm_size_acres": float(r["grower_farm_size"]) if r["grower_farm_size"] else None,
            "offline_campaign_attended": parse_bool(r["offline_campaign_attended"]),
            "campaign_attendance_date": r["campaign_attendance_date"],
        })
    col = db["growers"]
    await col.drop()
    await col.insert_many(docs)
    await col.create_index("state")
    await col.create_index("district")
    await col.create_index("primary_crop")
    await col.create_index("language")
    await col.create_index("device_type")
    await col.create_index("phone")
    print(f"  ✅ growers: {len(docs):,} docs inserted")


async def ingest_whatsapp(db, rows: list[dict]):
    docs = []
    for r in rows:
        docs.append({
            "_id": r["id"],
            "campaign_product": r["campaign_product"],
            "campaign_crop": r["campaign_crop"],
            "grower_id": r["grower_id"],
            "message_sent_date": r["message_sent_date"],
            "delivered": parse_bool(r["delivered_status"]),
            "opened": parse_bool(r["opened_status"]),
            "clicked": parse_bool(r["clicked_status"]),
        })
    col = db["whatsapp_log"]
    await col.drop()
    await col.insert_many(docs)
    await col.create_index("grower_id")
    await col.create_index("campaign_crop")
    await col.create_index("clicked")
    print(f"  ✅ whatsapp_log: {len(docs):,} docs inserted")


async def ingest_digital_funnel(db, rows: list[dict]):
    docs = []
    for r in rows:
        docs.append({
            "campaign_id": r["campaign_id"],
            "week_start_date": r["week_start_date"],
            "impressions": int(r["social_post_impression"]),
            "visits": int(r["landing_page_visits"]),
            "leads": int(r["lead_form_submission"]),
            "campaign_crop": r["campaign_crop"],
            "campaign_product": r["campaign_product"],
            "ctr": round(int(r["landing_page_visits"]) / int(r["social_post_impression"]) * 100, 4)
                   if int(r["social_post_impression"]) > 0 else 0,
        })
    col = db["digital_funnel"]
    await col.drop()
    await col.insert_many(docs)
    await col.create_index("campaign_id")
    print(f"  ✅ digital_funnel: {len(docs):,} docs inserted")


async def ingest_reps(db, rows: list[dict]):
    docs = []
    for r in rows:
        try:
            tehsil_list = json.loads(r["tehsil_list"])
        except Exception:
            tehsil_list = []
        docs.append({
            "_id": r["rep_id"],
            "territory_id": r["territory_id"],
            "territory_name": r["territory_name"],
            "state": r["state"],
            "district": r["district"],
            "tehsil_list": tehsil_list,
        })
    col = db["reps_territory"]
    await col.drop()
    await col.insert_many(docs)
    await col.create_index("district")
    print(f"  ✅ reps_territory: {len(docs):,} docs inserted")


async def ingest_retailers(db, rows: list[dict]):
    docs = []
    for r in rows:
        docs.append({
            "_id": r["retailer_id"],
            "territory_id": r["territory_id"],
            "state": r["state"],
            "district": r["district"],
            "tehsil": r["tehsil"],
        })
    col = db["retailers"]
    await col.drop()
    await col.insert_many(docs)
    await col.create_index("district")
    print(f"  ✅ retailers: {len(docs):,} docs inserted")


async def ingest_pos(db, rows: list[dict]):
    """Batch insert POS data in chunks to avoid memory issues."""
    col = db["retailer_pos"]
    await col.drop()
    chunk_size = 5000
    total = 0
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        docs = []
        for r in chunk:
            docs.append({
                "retailer_id": r["retailer_id"],
                "transaction_id": r["transaction_id"],
                "sku_id": r["sku_id"],
                "sku_name": r["sku_name"],
                "qty": int(r["sku_qty"]) if r["sku_qty"] else 0,
                "price": float(r["sku_price"]) if r["sku_price"] else 0.0,
                "revenue": float(r["sku_price"]) * int(r["sku_qty"])
                           if r["sku_price"] and r["sku_qty"] else 0.0,
                "transaction_date": r["transaction_date"],
            })
        await col.insert_many(docs)
        total += len(docs)
    await col.create_index("retailer_id")
    await col.create_index("sku_name")
    await col.create_index("transaction_date")
    print(f"  ✅ retailer_pos: {total:,} docs inserted")


async def ingest_inventory(db, rows: list[dict]):
    col = db["retailer_inventory"]
    await col.drop()
    chunk_size = 10000
    total = 0
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        docs = [{
            "retailer_id": r["retailer_id"],
            "sku_id": r["sku_id"],
            "sku_name": r["sku_name"],
            "qty": int(r["sku_qty"]) if r["sku_qty"] else 0,
            "in_stock": int(r["sku_qty"]) > 0 if r["sku_qty"] else False,
            "week_end_date": r["week_end_date"],
        } for r in chunk]
        await col.insert_many(docs)
        total += len(docs)
    await col.create_index([("sku_name", 1), ("week_end_date", -1)])
    await col.create_index("retailer_id")
    print(f"  ✅ retailer_inventory: {total:,} docs inserted")


async def ingest_visit_log(db, rows: list[dict]):
    col = db["visit_log"]
    await col.drop()
    docs = [{
        "rep_id": r["rep_id"],
        "visit_date": r["visit_date"],
        "territory_id": r["territory_id"],
        "tehsil": r["visit_tehsil"],
        "visit_type": r["visit_type"],
        "product_recommended": r["product_recommended"],
    } for r in rows]
    await col.insert_many(docs)
    await col.create_index("territory_id")
    await col.create_index("visit_date")
    print(f"  ✅ visit_log: {len(docs):,} docs inserted")


async def main():
    args = parse_args()

    if not MONGODB_URI:
        print("❌ MONGODB_URI not set in .env")
        sys.exit(1)

    print(f"🔗 Connecting to MongoDB Atlas...")
    client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGODB_URI,
        tlsCAFile=certifi.where(),
    )
    db = client[MONGODB_DB]
    await client.admin.command("ping")
    print(f"✅ Connected to database: {MONGODB_DB}\n")

    if args.check_only:
        existing = await db["growers"].count_documents({}, limit=1)
        client.close()
        if existing:
            print("✅ Growers collection already populated")
            return
        print("ℹ️ Growers collection is empty")
        sys.exit(1)

    print("📥 Starting ingestion...\n")

    files = {
        "growers": args.data_dir / "growers.csv",
        "whatsapp": args.data_dir / "whatsapp_campaign.csv",
        "funnel": args.data_dir / "digital_funnel_weekly.csv",
        "reps": args.data_dir / "reps_territory.csv",
        "retailers": args.data_dir / "retailers.csv",
        "pos": args.data_dir / "retailer_pos.csv",
        "inventory": args.data_dir / "retailer_inventory_weekly.csv",
        "visits": args.data_dir / "retailer_visit_log.csv",
    }

    for name, path in files.items():
        if not path.exists():
            print(f"  ⚠️  {path.name} not found, skipping")
            continue
        print(f"  📂 Loading {path.name}...")
        rows = read_csv(path)

        if name == "growers":
            await ingest_growers(db, rows)
        elif name == "whatsapp":
            await ingest_whatsapp(db, rows)
        elif name == "funnel":
            await ingest_digital_funnel(db, rows)
        elif name == "reps":
            await ingest_reps(db, rows)
        elif name == "retailers":
            await ingest_retailers(db, rows)
        elif name == "pos":
            await ingest_pos(db, rows)
        elif name == "inventory":
            await ingest_inventory(db, rows)
        elif name == "visits":
            await ingest_visit_log(db, rows)

    print("\n🎉 All data ingested successfully into MongoDB Atlas!")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
