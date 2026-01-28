from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime, timezone
import secrets
import csv
import io

# =========================
# BOOTSTRAP
# =========================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "global_db")]

app = FastAPI(title="GLOBAL API", version="2.0.0")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "Yusuf")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "2012")

# =========================
# AUTH
# =========================

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# =========================
# MODELS
# =========================

class PlatformPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "EUR"
    affiliate_url: Optional[str] = None
    url: Optional[str] = None
    in_stock: bool = True
    last_updated: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
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
    rating: Optional[float] = 4.5
    reviews_count: Optional[int] = 0
    brand: Optional[str] = None
    attributes: Dict[str, Any] = {}
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# =========================
# HELPERS
# =========================

def clean_price(val) -> float:
    if val is None:
        return 0.0
    s = str(val).strip()
    if not s:
        return 0.0

    s = s.replace("EUR", "").replace("USD", "").replace("€", "").replace("$", "").strip()

    if "," in s and "." not in s:
        s = s.replace(",", ".")
    else:
        s = s.replace(",", "")

    try:
        return float(s)
    except:
        return 0.0

# =========================
# CSV PARSER (SADE, SAĞLAM)
# =========================

async def parse_csv_feed(content: str, platform: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        try:
            external_id = row.get("external_id")
            name = row.get("name")

            if not external_id or not name:
                continue

            image = (row.get("image") or "").strip()
            if image.startswith("//"):
                image = "https:" + image

            product = {
                "external_id": external_id.strip(),
                "name": name.strip(),
                "description": name.strip(),
                "image": image,
                "price": clean_price(row.get("price")),
                "original_price": clean_price(row.get("original_price")),
                "affiliate_url": (row.get("affiliate_url") or "").strip(),
                "category": (row.get("category") or "General").strip(),
                "brand": (row.get("brand") or "").strip() or None,
                "in_stock": True,
            }

            products.append(product)

        except Exception as e:
            logger.error(f"CSV row error: {e}")
            continue

    return products

# =========================
# IMPORT SERVICE
# =========================

async def import_feed_products(feed_products: List[dict], platform: str) -> Tuple[int, int]:
    imported = 0
    updated = 0

    for fp in feed_products:
        try:
            existing = await db.products.find_one(
                {f"source_ids.{platform}": fp["external_id"]},
                {"_id": 0},
            )

            price_entry = PlatformPrice(
                platform=platform,
                price=fp.get("price", 0.0),
                original_price=fp.get("original_price", 0.0),
                currency="EUR",
                affiliate_url=fp.get("affiliate_url"),
                url=fp.get("affiliate_url"),
                in_stock=True,
                last_updated=datetime.now(timezone.utc).isoformat(),
            )

            if existing:
                prices = existing.get("prices", [])
                prices = [p for p in prices if p["platform"] != platform]
                prices.append(price_entry.model_dump())

                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "prices": prices,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                updated += 1

            else:
                slug = (fp.get("category") or "general").lower().replace(" ", "-")

                product = Product(
                    name=fp["name"],
                    description=fp["description"],
                    image=fp["image"],
                    images=[fp["image"]] if fp["image"] else [],
                    category=fp["category"],
                    category_slug=slug,
                    prices=[price_entry.model_dump()],
                    best_price=fp["price"],
                    best_platform=platform,
                    brand=fp.get("brand"),
                    source_ids={platform: fp["external_id"]},
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat(),
                )

                await db.products.insert_one(product.model_dump())
                imported += 1

        except Exception as e:
            logger.error(f"Import error: {e}")
            continue

    return imported, updated

# =========================
# ROUTES
# =========================

@api_router.post("/admin/import/csv")
async def import_products_from_csv(
    platform: str = Query(...),
    file: UploadFile = File(...),
    admin: str = Depends(verify_admin),
):
    raw = await file.read()
    content = raw.decode("utf-8-sig", errors="ignore")

    feed_products = await parse_csv_feed(content, platform)
    imported, updated = await import_feed_products(feed_products, platform)

    return {
        "success": True,
        "platform": platform,
        "rows_parsed": len(feed_products),
        "imported": imported,
        "updated": updated,
    }

# 🔹 LISTE (Emergent uyumlu)
@api_router.get("/products")
async def get_products(
    limit: int = Query(default=50, le=100),
    skip: int = 0,
):
    products = await db.products.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return products

# 🔹 DETAY (ÜRÜN BULUNAMADI HATASI ÇÖZÜLDÜ)
@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product

@api_router.get("/categories")
async def get_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(200)

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
