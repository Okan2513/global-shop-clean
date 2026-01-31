from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
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
import re
from difflib import SequenceMatcher

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

app = FastAPI(title="GLOBAL API", version="6.0.0")
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
    if not (
        secrets.compare_digest(credentials.username, ADMIN_USERNAME)
        and secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    ):
        raise HTTPException(status_code=401)
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
    brand: Optional[str] = None
    source_ids: Dict[str, str] = {}
    match_key: Optional[str] = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# =========================
# HELPERS
# =========================

def clean_price(val) -> float:
    if val is None:
        return 0.0
    s = str(val).strip()
    if s == "":
        return 0.0

    s = s.replace("€", "").replace("$", "").replace("EUR", "").replace("USD", "")
    s = s.replace("\u00a0", " ").strip()

    if "," in s and "." in s:
        s = s.replace(".", "")
        s = s.replace(",", ".")
    else:
        s = s.replace(",", ".")

    s = re.sub(r"[^0-9.\-]", "", s)

    try:
        return float(s)
    except:
        return 0.0

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()

def fix_image_url(url: str) -> str:
    if not url:
        return "https://via.placeholder.com/500x500?text=No+Image"
    url = str(url).strip()
    if url.startswith("//"):
        url = "https:" + url
    if not url.startswith("http"):
        return "https://via.placeholder.com/500x500?text=No+Image"
    return url

def calculate_best_price(prices: List[dict]) -> Tuple[float, str]:
    if not prices:
        return 0, ""
    best = min(
        prices,
        key=lambda x: x.get("price", 0) if x.get("price", 0) > 0 else float("inf")
    )
    return best.get("price", 0) or 0, best.get("platform", "") or ""

# =========================
# CSV PARSER
# =========================

async def parse_csv_feed(content: str, platform: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        name = row.get("name") or row.get("title")
        if not name:
            continue

        product = {
            "external_id": row.get("external_id") or row.get("id") or str(uuid.uuid4()),
            "name": str(name).strip(),
            "image": fix_image_url(row.get("image") or row.get("image_url")),
            "price": clean_price(row.get("price")),
            "original_price": clean_price(row.get("original_price")),
            "affiliate_url": row.get("affiliate_url") or row.get("link") or "",
            "category": row.get("category") or "General",
        }

        products.append(product)

    return products

# =========================
# MATCHING
# =========================

async def find_matching_product(fp: dict, platform: str):
    existing = await db.products.find_one(
        {f"source_ids.{platform}": fp.get("external_id")},
        {"_id": 0}
    )
    return existing

# =========================
# IMPORT
# =========================

async def import_feed_products(feed_products: List[dict], platform: str):
    imported = 0
    updated = 0

    for fp in feed_products:

        match = await find_matching_product(fp, platform)

        price_entry = PlatformPrice(
            platform=platform,
            price=fp.get("price", 0.0) or 0.0,
            original_price=fp.get("original_price", 0.0) or 0.0,
            affiliate_url=fp.get("affiliate_url", ""),
            last_updated=datetime.now(timezone.utc).isoformat(),
        )

        if match:
            prices = match.get("prices", []) or []
            prices = [p for p in prices if p.get("platform") != platform]
            prices.append(price_entry.model_dump())

            best_price, best_platform = calculate_best_price(prices)

            await db.products.update_one(
                {"id": match["id"]},
                {"$set": {
                    "prices": prices,
                    "best_price": best_price,
                    "best_platform": best_platform,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            updated += 1
        else:
            slug = normalize_text(fp.get("category", "General")).replace(" ", "-")

            product = Product(
                name=fp.get("name", ""),
                image=fp.get("image", ""),
                images=[fp.get("image", "")] if fp.get("image", "") else [],
                category=fp.get("category", "General"),
                category_slug=slug or "general",
                prices=[price_entry.model_dump()],
                best_price=fp.get("price", 0.0) or 0.0,
                best_platform=platform,
                source_ids={platform: fp.get("external_id")},
                created_at=datetime.now(timezone.utc).isoformat(),
                updated_at=datetime.now(timezone.utc).isoformat(),
            )

            await db.products.insert_one(product.model_dump())
            imported += 1

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
        "rows": len(feed_products),
        "imported": imported,
        "updated": updated,
    }

# ✅ PLATFORM FILTER + INFINITE SCROLL READY
@api_router.get("/products")
async def get_products(
    platform: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    skip: int = 0,
):
    query = {}

    if platform:
        query["prices.platform"] = platform.lower()

    products = await db.products.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)

    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
