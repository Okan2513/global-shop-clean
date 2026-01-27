from fastapi import FastAPI, APIRouter, HTTPException, Query, Header, UploadFile, File, BackgroundTasks, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import hashlib
import secrets
import json
import httpx
import csv
import io
import xml.etree.ElementTree as ET
import asyncio
import re

# ================== PRICE CLEANER ==================

def clean_price(val):
    if not val:
        return 0.0
    s = str(val)
    s = s.replace("EUR", "").replace("USD", "").replace("€", "").replace("$", "")
    s = s.replace(",", ".").strip()
    try:
        return float(s)
    except:
        return 0.0

# ================== INIT ==================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'global_db')]

app = FastAPI(title="GLOBAL API", version="2.0.0")
api_router = APIRouter(prefix="/api")

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "Yusuf")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "2012")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================== AUTH ==================

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if not (
        secrets.compare_digest(credentials.username, ADMIN_USERNAME)
        and secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    ):
        raise HTTPException(status_code=401, detail="Invalid admin credentials",
                            headers={"WWW-Authenticate": "Basic"})
    return credentials.username

# ================== MODELS ==================

class ImportRequest(BaseModel):
    url: str
    category: Optional[str] = "General"

class PlatformPrice(BaseModel):
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "USD"
    affiliate_url: Optional[str] = None
    url: Optional[str] = None
    in_stock: bool = True
    last_updated: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    images: List[str] = []
    category: Optional[str] = "General"
    category_slug: Optional[str] = "general"
    prices: List[dict] = []
    best_price: Optional[float] = 0
    best_platform: Optional[str] = ""
    discount_percent: Optional[int] = None
    brand: Optional[str] = None
    attributes: Dict[str, Any] = {}
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ================== FEED PARSER (FINAL) ==================

async def parse_csv_feed(content: str, platform: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        try:
            product = {
                "external_id": row.get("product_id") or row.get("sku") or row.get("id"),
                "name": row.get("product_name") or row.get("title") or row.get("name"),
                "description": row.get("description") or row.get("product_description") or "",
                "image": row.get("image_url") or row.get("image") or row.get("image_link"),

                # 🔥 EUR / USD / € uyumlu
                "price": clean_price(row.get("price") or row.get("sale_price")),
                "original_price": clean_price(row.get("original_price") or row.get("retail_price")),

                "affiliate_url": row.get("affiliate_url") or row.get("deep_link") or row.get("link"),
                "category": row.get("category") or row.get("product_type") or "General",
                "brand": row.get("brand") or row.get("manufacturer"),
                "in_stock": row.get("availability", "in stock").lower() == "in stock",
            }

            if product["external_id"] and product["name"]:
                products.append(product)

        except Exception as e:
            logger.error(f"Error parsing row: {e}")
            continue

    return products

# ================== IMPORT SERVICE ==================

async def import_feed_products(feed_products: List[dict], platform: str):
    imported = 0
    updated = 0

    for fp in feed_products:
        try:
            existing = await db.products.find_one({f"source_ids.{platform}": fp["external_id"]})

            price_entry = {
                "platform": platform,
                "price": fp["price"],
                "original_price": fp.get("original_price"),
                "currency": "EUR",
                "affiliate_url": fp["affiliate_url"],
                "in_stock": fp.get("in_stock", True),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

            if existing:
                prices = existing.get("prices", [])
                prices = [p for p in prices if p["platform"] != platform]
                prices.append(price_entry)

                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "prices": prices,
                        "best_price": min(p["price"] for p in prices if p["price"] > 0),
                        "best_platform": platform,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                updated += 1
            else:
                product = Product(
                    name=fp["name"],
                    description=fp.get("description", fp["name"]),
                    image=fp["image"],
                    images=[fp["image"]] if fp["image"] else [],
                    category=fp.get("category", "General"),
                    category_slug=fp.get("category", "general").lower().replace(" ", "-"),
                    prices=[price_entry],
                    best_price=fp["price"],
                    best_platform=platform,
                    brand=fp.get("brand"),
                    source_ids={platform: fp["external_id"]},
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat()
                )

                await db.products.insert_one(product.model_dump())
                imported += 1

        except Exception as e:
            logger.error(f"Error importing product: {e}")
            continue

    return imported, updated

# ================== CSV ENDPOINT ==================

@api_router.post("/admin/import/csv")
async def import_products_from_csv(
    platform: str = Query(...),
    file: UploadFile = File(...),
    admin: str = Depends(verify_admin)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    raw = await file.read()
    content = raw.decode("utf-8-sig", errors="ignore")

    feed_products = await parse_csv_feed(content, platform)
    imported, updated = await import_feed_products(feed_products, platform)

    return {
        "success": True,
        "platform": platform,
        "rows": len(feed_products),
        "imported": imported,
        "updated": updated
    }

# ================== ROUTER ==================

@app.get("/")
async def root():
    return {"status": "ok"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown():
    client.close()
