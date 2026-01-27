# ================== GLOBAL API SERVER (ALIEXPRESS CSV DESTEKLİ) ==================

from fastapi import FastAPI, APIRouter, HTTPException, Query, Header, UploadFile, File, BackgroundTasks, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, hashlib, secrets, json, csv, io, asyncio, httpx, re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'global_db')]

app = FastAPI(title="GLOBAL API", version="2.0.0")
api_router = APIRouter(prefix="/api")

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'globaladmin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Gl0b4l$ecure2024!')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if not (secrets.compare_digest(credentials.username, ADMIN_USERNAME) and secrets.compare_digest(credentials.password, ADMIN_PASSWORD)):
        raise HTTPException(status_code=401, detail="Invalid admin credentials", headers={"WWW-Authenticate": "Basic"})
    return credentials.username

# ================= MODELS =================

class ImportRequest(BaseModel):
    url: str
    category: Optional[str] = "General"

class PlatformPrice(BaseModel):
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "EUR"
    affiliate_url: Optional[str] = None
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
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ================= ONE DRIVE CSV FETCH =================

async def fetch_onedrive_csv(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=120) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.text

# ================= ALIEXPRESS CSV PARSER =================

async def parse_aliexpress_csv(content: str, category: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        try:
            price = float(row.get("Discount Price") or row.get("Original Price") or "0")
            orig = float(row.get("Original Price") or price)

            discount = int(((orig - price) / orig) * 100) if orig > price else None

            product = {
                "external_id": row.get("ProductId"),
                "name": row.get("Product Title"),
                "description": row.get("Product Title"),
                "image": row.get("Image Url"),
                "price": price,
                "original_price": orig,
                "affiliate_url": row.get("Promotion Link"),
                "category": category,
                "discount_percent": discount
            }

            if product["external_id"] and product["name"]:
                products.append(product)

        except Exception as e:
            logger.error(f"CSV row error: {e}")
            continue

    return products

# ================= IMPORT ENGINE =================

async def import_feed_products(feed_products: List[dict], platform: str) -> tuple:
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
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

            if existing:
                prices = existing.get("prices", [])
                prices = [p for p in prices if p["platform"] != platform]
                prices.append(price_entry)

                best_price = min(p["price"] for p in prices if p["price"] > 0)

                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": {"prices": prices, "best_price": best_price, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                updated += 1
            else:
                product = Product(
                    name=fp["name"],
                    description=fp["description"],
                    image=fp["image"],
                    images=[fp["image"]],
                    category=fp["category"],
                    category_slug=fp["category"].lower().replace(" ", "-"),
                    prices=[price_entry],
                    best_price=fp["price"],
                    best_platform=platform,
                    discount_percent=fp.get("discount_percent"),
                    source_ids={platform: fp["external_id"]},
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat()
                )

                await db.products.insert_one(product.model_dump())
                imported += 1

        except Exception as e:
            logger.error(f"Import error: {e}")
            continue

    return imported, updated

# ================= ROUTE – TEK TUŞLA ALIEXPRESS CSV IMPORT =================

@api_router.post("/import")
async def import_from_admin(request: ImportRequest, admin: str = Depends(verify_admin)):
    url = request.url
    category = request.category

    # Eğer OneDrive / CSV ise otomatik AliExpress feed import
    if "1drv.ms" in url or url.endswith(".csv"):
        logger.info("AliExpress CSV import başlıyor...")

        content = await fetch_onedrive_csv(url)
        products = await parse_aliexpress_csv(content, category)

        imported, updated = await import_feed_products(products, "aliexpress")

        return {
            "success": True,
            "platform": "aliexpress",
            "imported": imported,
            "updated": updated,
            "total": imported + updated
        }

    raise HTTPException(status_code=400, detail="Bu endpoint sadece CSV feed içindir.")

# ================= FINAL SETUP =================

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
