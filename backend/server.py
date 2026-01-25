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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'global_db')]

# Create the main app
app = FastAPI(title="GLOBAL API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBasic()

# Admin credentials - stored securely
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'globaladmin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Gl0b4l$ecure2024!')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============== AUTHENTICATION ===============

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials using HTTP Basic Auth"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# =============== MODELS ===============

# PANELDEKİ IMPORT İSTEĞİ İÇİN GEREKLİ MODEL
class ImportRequest(BaseModel):
    url: str
    category: Optional[str] = "General"

class PlatformPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "USD"
    affiliate_url: Optional[str] = None
    url: Optional[str] = None
    in_stock: bool = True
    last_updated: Optional[str] = None

    def get_url(self):
        return self.affiliate_url or self.url or "#"

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_tr: Optional[str] = None
    description: Optional[str] = ""
    description_tr: Optional[str] = None
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
    sku: Optional[str] = None
    brand: Optional[str] = None
    attributes: Dict[str, Any] = {}
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_tr: Optional[str] = None
    slug: str
    image: str
    product_count: int = 0

class FeedImport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str
    filename: str
    status: str = "pending"
    products_imported: int = 0
    products_updated: int = 0
    errors: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class SyncLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str
    sync_type: str
    status: str = "running"
    products_synced: int = 0
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    error_message: Optional[str] = None

class APISettings(BaseModel):
    aliexpress_app_key: Optional[str] = None
    aliexpress_app_secret: Optional[str] = None
    aliexpress_tracking_id: Optional[str] = None
    amazon_tag: Optional[str] = None
    temu_affiliate_id: Optional[str] = None
    temu_api_key: Optional[str] = None
    shein_affiliate_id: Optional[str] = None
    shein_api_key: Optional[str] = None

class SiteSettings(BaseModel):
    contact_email: Optional[str] = None
    site_name: Optional[str] = "GLOBAL"
    footer_text: Optional[str] = None

class FeedConfig(BaseModel):
    platform: str
    feed_url: Optional[str] = None
    feed_type: str = "csv"
    enabled: bool = True
    last_sync: Optional[str] = None

# =============== ALIEXPRESS API SERVICE ===============

class AliExpressAPI:
    BASE_URL = "https://api-sg.aliexpress.com/sync"

    def __init__(self, app_key: str, app_secret: str, tracking_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.tracking_id = tracking_id

    def _sign_request(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_str = self.app_secret
        for k, v in sorted_params:
            sign_str += f"{k}{v}"
        sign_str += self.app_secret
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()

    async def _make_request(self, method: str, params: dict) -> dict:
        base_params = {
            "app_key": self.app_key,
            "method": method,
            "sign_method": "md5",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "2.0",
        }
        base_params.update(params)
        base_params["sign"] = self._sign_request(base_params)

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(self.BASE_URL, data=base_params)
            return response.json()

    async def search_products(self, keywords: str, category_id: str = None,
                             min_price: float = None, max_price: float = None,
                             page: int = 1, page_size: int = 50) -> List[dict]:
        params = {
            "keywords": keywords,
            "target_currency": "USD",
            "target_language": "EN",
            "tracking_id": self.tracking_id,
            "page_no": str(page),
            "page_size": str(min(page_size, 50)),
        }

        if category_id:
            params["category_ids"] = category_id
        if min_price:
            params["min_sale_price"] = str(int(min_price * 100))
        if max_price:
            params["max_sale_price"] = str(int(max_price * 100))

        result = await self._make_request("aliexpress.affiliate.product.query", params)

        if "aliexpress_affiliate_product_query_response" in result:
            resp = result["aliexpress_affiliate_product_query_response"]["resp_result"]
            if resp.get("resp_code") == 200:
                products = resp.get("result", {}).get("products", {}).get("product", [])
                return products if isinstance(products, list) else [products]

        return []

    async def get_hot_products(self, category_id: str = None, page: int = 1) -> List[dict]:
        params = {
            "target_currency": "USD",
            "target_language": "EN",
            "tracking_id": self.tracking_id,
            "page_no": str(page),
            "page_size": "50",
        }

        if category_id:
            params["category_ids"] = category_id

        result = await self._make_request("aliexpress.affiliate.hotproduct.query", params)

        if "aliexpress_affiliate_hotproduct_query_response" in result:
            resp = result["aliexpress_affiliate_hotproduct_query_response"]["resp_result"]
            if resp.get("resp_code") == 200:
                products = resp.get("result", {}).get("products", {}).get("product", [])
                return products if isinstance(products, list) else [products]

        return []

def transform_aliexpress_product(ae_product: dict) -> dict:
    price = float(ae_product.get("target_sale_price", "0").replace(",", ""))
    original_price = float(ae_product.get("target_original_price", "0").replace(",", ""))
    discount = 0
    if original_price > 0 and price < original_price:
        discount = int(((original_price - price) / original_price) * 100)

    return {
        "external_id": ae_product.get("product_id"),
        "name": ae_product.get("product_title", ""),
        "description": ae_product.get("product_title", ""),
        "image": ae_product.get("product_main_image_url", ""),
        "images": ae_product.get("product_small_image_urls", {}).get("string", []),
        "price": price,
        "original_price": original_price,
        "discount_percent": discount,
        "affiliate_url": ae_product.get("promotion_link", ""),
        "category": ae_product.get("second_level_category_name", "General"),
        "rating": float(ae_product.get("evaluate_rate", "0").replace("%", "")) / 20,
        "reviews_count": int(ae_product.get("lastest_volume", 0)),
    }

# =============== FEED IMPORT SERVICE ===============

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
                "price": float(row.get("price") or row.get("sale_price") or "0"),
                "original_price": float(row.get("original_price") or row.get("retail_price") or "0"),
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

async def parse_xml_feed(content: str, platform: str) -> List[dict]:
    products = []

    try:
        root = ET.fromstring(content)
        items = root.findall(".//item") or root.findall(".//product") or root.findall(".//entry")

        for item in items:
            try:
                def get_text(elem, tags):
                    for tag in tags:
                        el = elem.find(tag)
                        if el is not None and el.text:
                            return el.text.strip()
                    return ""

                price_text = get_text(item, ["g:price", "price", "sale_price"]).replace("USD", "").replace("$", "").strip()
                orig_price_text = get_text(item, ["g:sale_price", "original_price"]).replace("USD", "").replace("$", "").strip()

                product = {
                    "external_id": get_text(item, ["g:id", "id", "sku", "product_id"]),
                    "name": get_text(item, ["g:title", "title", "name", "product_name"]),
                    "description": get_text(item, ["g:description", "description"]),
                    "image": get_text(item, ["g:image_link", "image_url", "image"]),
                    "price": float(price_text) if price_text else 0,
                    "original_price": float(orig_price_text) if orig_price_text else 0,
                    "affiliate_url": get_text(item, ["g:link", "link", "affiliate_url", "url"]),
                    "category": get_text(item, ["g:product_type", "category", "product_type"]),
                    "brand": get_text(item, ["g:brand", "brand"]),
                }

                if product["external_id"] and product["name"]:
                    products.append(product)
            except Exception as e:
                logger.error(f"Error parsing XML item: {e}")
                continue
    except ET.ParseError as e:
        logger.error(f"XML Parse error: {e}")

    return products

async def fetch_feed_from_url(url: str, feed_type: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        response = await http_client.get(url)
        response.raise_for_status()
        return response.text

async def import_feed_products(feed_products: List[dict], platform: str) -> tuple:
    imported = 0
    updated = 0

    for fp in feed_products:
        try:
            existing = await db.products.find_one({f"source_ids.{platform}": fp["external_id"]}, {"_id": 0})

            price_entry = PlatformPrice(
                platform=platform,
                price=fp["price"],
                original_price=fp.get("original_price"),
                currency="USD",
                affiliate_url=fp["affiliate_url"],
                in_stock=fp.get("in_stock", True),
                last_updated=datetime.now(timezone.utc).isoformat()
            )

            if existing:
                prices = existing.get("prices", [])
                prices = [p for p in prices if p["platform"] != platform]
                prices.append(price_entry.model_dump())

                best_price = min(p["price"] for p in prices)
                best_platform = next(p["platform"] for p in prices if p["price"] == best_price)

                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "prices": prices,
                        "best_price": best_price,
                        "best_platform": best_platform,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                updated += 1
            else:
                category_slug = fp.get("category", "general").lower().replace(" ", "-").replace("&", "and")
                orig_price = fp.get("original_price", fp["price"])
                discount = int(((orig_price - fp["price"]) / orig_price) * 100) if orig_price > fp["price"] else None

                product = Product(
                    name=fp["name"],
                    description=fp.get("description", fp["name"]),
                    image=fp["image"],
                    images=[fp["image"]] if fp["image"] else [],
                    category=fp.get("category", "General"),
                    category_slug=category_slug,
                    prices=[price_entry.model_dump()],
                    best_price=fp["price"],
                    best_platform=platform,
                    discount_percent=discount,
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

# =============== AUTOMATED SYNC SERVICE ===============

async def sync_aliexpress_products(keywords_list: List[str] = None):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})

    if not settings or not settings.get("aliexpress_app_key"):
        logger.warning("AliExpress API not configured")
        return {"success": False, "error": "AliExpress API not configured"}

    api = AliExpressAPI(
        app_key=settings["aliexpress_app_key"],
        app_secret=settings["aliexpress_app_secret"],
        tracking_id=settings["aliexpress_tracking_id"]
    )

    sync_log = SyncLog(platform="aliexpress", sync_type="auto")
    await db.sync_logs.insert_one(sync_log.model_dump())

    total_synced = 0

    try:
        # Sync hot products
        ae_products = await api.get_hot_products()
        feed_products = [transform_aliexpress_product(p) for p in ae_products]
        imported, updated = await import_feed_products(feed_products, "aliexpress")
        total_synced += imported + updated

        # Sync by keywords if provided
        if keywords_list:
            for keyword in keywords_list:
                ae_products = await api.search_products(keyword)
                feed_products = [transform_aliexpress_product(p) for p in ae_products]
                imported, updated = await import_feed_products(feed_products, "aliexpress")
                total_synced += imported + updated

        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "completed",
                "products_synced": total_synced,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        await update_category_counts()

        return {"success": True, "products_synced": total_synced}

    except Exception as e:
        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": False, "error": str(e)}

async def sync_feed_from_url(platform: str, feed_url: str, feed_type: str = "csv"):
    sync_log = SyncLog(platform=platform, sync_type="feed_url")
    await db.sync_logs.insert_one(sync_log.model_dump())

    try:
        content = await fetch_feed_from_url(feed_url, feed_type)

        if feed_type == "csv":
            products = await parse_csv_feed(content, platform)
        else:
            products = await parse_xml_feed(content, platform)

        imported, updated = await import_feed_products(products, platform)

        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "completed",
                "products_synced": imported + updated,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        # Update feed config last sync time
        await db.feed_configs.update_one(
            {"platform": platform},
            {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

        await update_category_counts()

        return {"success": True, "imported": imported, "updated": updated}

    except Exception as e:
        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": False, "error": str(e)}

async def run_all_syncs():
    results = {}

    # Sync AliExpress
    results["aliexpress"] = await sync_aliexpress_products()

    # Sync configured feeds (Temu, Shein)
    feed_configs = await db.feed_configs.find({"enabled": True}, {"_id": 0}).to_list(10)
    for config in feed_configs:
        if config.get("feed_url"):
            results[config["platform"]] = await sync_feed_from_url(
                config["platform"],
                config["feed_url"],
                config.get("feed_type", "csv")
            )

    return results

# =============== SEARCH HELPER FUNCTIONS ===============

def normalize_search_term(search: str) -> str:
    normalized = " ".join(search.lower().split())
    normalized = normalized.replace("-", " ").replace("_", " ")
    return normalized

def get_category_keywords() -> dict:
    return {
        "electronics": ["phone", "laptop", "computer", "tablet", "watch", "earbuds", "headphone", "speaker", "charger", "cable", "power bank", "bluetooth", "wireless", "smart", "gadget", "electronic"],
        "fashion": ["dress", "shirt", "pants", "jeans", "jacket", "coat", "shoes", "sneaker", "boot", "clothing", "wear", "outfit", "fashion", "style", "men", "women", "kid"],
        "home-garden": ["lamp", "light", "furniture", "decor", "kitchen", "garden", "home", "house", "bed", "sofa", "chair", "table", "storage", "organizer"],
        "beauty": ["makeup", "skincare", "cosmetic", "lipstick", "cream", "lotion", "perfume", "beauty", "hair", "nail", "face", "skin"],
        "sports": ["fitness", "gym", "exercise", "sport", "yoga", "running", "cycling", "outdoor", "camping", "hiking"],
        "bags": ["bag", "backpack", "purse", "wallet", "handbag", "luggage", "tote", "messenger", "shoulder bag"],
        "toys": ["toy", "game", "puzzle", "doll", "lego", "kids", "children", "play"],
        "jewelry": ["ring", "necklace", "bracelet", "earring", "pendant", "gold", "silver", "jewelry", "jewel"]
    }

def detect_category_from_search(search: str) -> Optional[str]:
    search_lower = search.lower()
    category_keywords = get_category_keywords()

    max_matches = 0
    best_category = None

    for category, keywords in category_keywords.items():
        matches = sum(1 for kw in keywords if kw in search_lower)
        if matches > max_matches:
            max_matches = matches
            best_category = category

    return best_category if max_matches > 0 else None

# =============== ROUTES ===============

@api_router.get("/")
async def root():
    return {"message": "GLOBAL API - Price Comparison Platform", "version": "2.0.0"}

# ✅ EKLENDİ: Mağazaya Git için güvenli redirect endpoint'i (DB'deki linke 302 yönlendirir)
@api_router.get("/redirect/{product_id}/{platform}")
async def redirect_to_store(product_id: str, platform: str):
    """
    Frontend "Mağazaya Git" butonu buraya gider.
    Backend DB'den ürünün ilgili platform linkini bulur ve 302 ile yönlendirir.
    """
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prices = product.get("prices", [])
    target = None
    for p in prices:
        if (p.get("platform") or "").lower() == platform.lower():
            target = p
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"No price entry for platform: {platform}")

    # affiliate_url varsa onu kullan, yoksa url, yoksa hata
    url = target.get("affiliate_url") or target.get("url")
    if not url or url == "#":
        raise HTTPException(status_code=400, detail="Store URL not available for this product/platform")

    return RedirectResponse(url=url, status_code=302)

# PANELDEKİ 404 HATASINI ÇÖZEN VE AMAZON DAHİL TÜMÜNÜ AKTARAN KRİTİK ROUTE
@api_router.post("/import")
async def import_single_product(request: ImportRequest, admin: str = Depends(verify_admin)):
    """Panelden gelen Amazon, AliExpress, Shein veya Temu linkini işler"""
    url = request.url.lower()
    category = request.category

    platform = "general"
    if "amazon" in url: platform = "amazon"
    elif "aliexpress.com" in url: platform = "aliexpress"
    elif "shein.com" in url: platform = "shein"
    elif "temu.com" in url: platform = "temu"

    logger.info(f"Import işlemi başlatıldı: {platform.upper()} - URL: {url}")

    new_product = {
        "id": str(uuid.uuid4()),
        "name": f"Yeni {platform.capitalize()} Ürünü",
        "description": f"{platform.upper()} üzerinden sisteme eklendi.",
        "image": "https://via.placeholder.com/400",
        "images": ["https://via.placeholder.com/400"],
        "category": category,
        "category_slug": category.lower().replace(" ", "-").replace("&", "and"),
        "prices": [
            {
                "platform": platform,
                "price": 0.0,
                "currency": "USD",
                "url": url,
                "in_stock": True,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        ],
        "best_price": 0.0,
        "best_platform": platform,
        "source_ids": {platform: "pending"},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        await db.products.insert_one(new_product)
        await update_category_counts()
        return {"success": True, "message": f"{platform.upper()} ürünü eklendi!", "id": new_product["id"]}
    except Exception as e:
        logger.error(f"Import hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Products Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    platform: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "popular",
    limit: int = Query(default=50, le=100),
    skip: int = 0,
    lang: str = "en"
):
    count = await db.products.count_documents({})
    if count == 0:
        await seed_demo_products()

    query = {}
    search_boost_category = None

    if category:
        query["category_slug"] = category

    if search:
        normalized_search = normalize_search_term(search)

        if not category:
            search_boost_category = detect_category_from_search(normalized_search)

        search_words = normalized_search.split()
        search_conditions = []

        for word in search_words:
            if len(word) >= 2:
                word_conditions = [
                    {"name": {"$regex": f"\\b{word}\\b", "$options": "i"}},
                    {"name_tr": {"$regex": f"\\b{word}\\b", "$options": "i"}},
                    {"name": {"$regex": word, "$options": "i"}},
                    {"description": {"$regex": word, "$options": "i"}},
                    {"brand": {"$regex": word, "$options": "i"}},
                    {"category": {"$regex": word, "$options": "i"}},
                ]

                if len(word) >= 4:
                    typo_pattern = ".*".join(word[:min(len(word), 6)])
                    word_conditions.append({"name": {"$regex": typo_pattern, "$options": "i"}})

                search_conditions.append({"$or": word_conditions})

        if search_conditions:
            if len(search_conditions) == 1:
                query["$or"] = search_conditions[0]["$or"]
            else:
                query["$and"] = search_conditions

    if platform:
        query["prices.platform"] = platform

    if min_price is not None:
        query["best_price"] = {"$gte": min_price}

    if max_price is not None:
        if "best_price" in query:
            query["best_price"]["$lte"] = max_price
        else:
            query["best_price"] = {"$lte": max_price}

    sort_options = {
        "popular": [("reviews_count", -1)],
        "price_asc": [("best_price", 1)],
        "price_desc": [("best_price", -1)],
        "newest": [("created_at", -1)],
        "discount": [("discount_percent", -1)]
    }
    sort_by = sort_options.get(sort, [("reviews_count", -1)])

    if search_boost_category and not category:
        category_query = {**query, "category_slug": search_boost_category}
        category_products = await db.products.find(category_query, {"_id": 0}).sort(sort_by).limit(limit).to_list(limit)

        other_query = {**query}
        if "$and" not in other_query:
            other_query["category_slug"] = {"$ne": search_boost_category}
        else:
            other_query["$and"].append({"category_slug": {"$ne": search_boost_category}})

        remaining = limit - len(category_products)
        if remaining > 0:
            other_products = await db.products.find(other_query, {"_id": 0}).sort(sort_by).skip(skip).limit(remaining).to_list(remaining)
            return category_products + other_products
        return category_products[:limit]

    products = await db.products.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, lang: str = "en"):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/products/search/suggestions")
async def get_search_suggestions(q: str = Query(min_length=2)):
    normalized_q = normalize_search_term(q)

    search_conditions = [
        {"name": {"$regex": normalized_q, "$options": "i"}},
        {"name_tr": {"$regex": normalized_q, "$options": "i"}},
        {"brand": {"$regex": normalized_q, "$options": "i"}},
        {"category": {"$regex": normalized_q, "$options": "i"}}
    ]

    if len(normalized_q) >= 4:
        typo_pattern = ".*".join(normalized_q[:min(len(normalized_q), 8)])
        search_conditions.append({"name": {"$regex": typo_pattern, "$options": "i"}})

    products = await db.products.find(
        {"$or": search_conditions},
        {"_id": 0, "name": 1, "name_tr": 1, "category": 1, "category_slug": 1, "best_price": 1, "best_platform": 1}
    ).limit(10).to_list(10)

    detected_category = detect_category_from_search(normalized_q)

    suggestions = []
    seen_names = set()

    for p in products:
        name = p["name"]
        if name.lower() not in seen_names:
            seen_names.add(name.lower())
            suggestions.append({
                "name": name,
                "category": p["category"],
                "category_slug": p.get("category_slug"),
                "best_price": p.get("best_price"),
                "best_platform": p.get("best_platform")
            })

    return {
        "suggestions": suggestions,
        "detected_category": detected_category,
        "query": q
    }

# Categories Routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories(lang: str = "en"):
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    if not categories:
        categories = await seed_categories()
    return categories

# Admin Routes - Feed Import
@api_router.post("/admin/feeds/import")
async def import_feed(
    file: UploadFile = File(...),
    platform: str = Query(..., description="Platform: temu, shein, or aliexpress"),
    background_tasks: BackgroundTasks = None,
    admin: str = Depends(verify_admin)
):
    if platform not in ["temu", "shein", "aliexpress"]:
        raise HTTPException(status_code=400, detail="Invalid platform")

    content = await file.read()
    content_str = content.decode("utf-8")

    feed_import = FeedImport(
        platform=platform,
        filename=file.filename,
        status="processing"
    )
    await db.feed_imports.insert_one(feed_import.model_dump())

    try:
        if file.filename.endswith(".csv"):
            products = await parse_csv_feed(content_str, platform)
        elif file.filename.endswith(".xml"):
            products = await parse_xml_feed(content_str, platform)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or XML.")

        imported, updated = await import_feed_products(products, platform)

        await db.feed_imports.update_one(
            {"id": feed_import.id},
            {"$set": {
                "status": "completed",
                "products_imported": imported,
                "products_updated": updated,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        await update_category_counts()

        return {
            "success": True,
            "import_id": feed_import.id,
            "products_imported": imported,
            "products_updated": updated
        }

    except Exception as e:
        await db.feed_imports.update_one(
            {"id": feed_import.id},
            {"$set": {
                "status": "failed",
                "errors": [str(e)],
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/feeds/imports")
async def get_feed_imports(limit: int = 20, admin: str = Depends(verify_admin)):
    imports = await db.feed_imports.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return imports

# Admin Routes - Feed URL Configuration
@api_router.post("/admin/feeds/config")
async def configure_feed(config: FeedConfig, admin: str = Depends(verify_admin)):
    await db.feed_configs.update_one(
        {"platform": config.platform},
        {"$set": config.model_dump()},
        upsert=True
    )
    return {"success": True, "message": f"Feed config for {config.platform} updated"}

@api_router.get("/admin/feeds/configs")
async def get_feed_configs(admin: str = Depends(verify_admin)):
    configs = await db.feed_configs.find({}, {"_id": 0}).to_list(10)
    return configs

@api_router.post("/admin/feeds/sync/{platform}")
async def sync_platform_feed(platform: str, background_tasks: BackgroundTasks, admin: str = Depends(verify_admin)):
    if platform == "aliexpress":
        result = await sync_aliexpress_products()
    else:
        config = await db.feed_configs.find_one({"platform": platform}, {"_id": 0})
        if not config or not config.get("feed_url"):
            raise HTTPException(status_code=400, detail=f"No feed URL configured for {platform}")
        result = await sync_feed_from_url(platform, config["feed_url"], config.get("feed_type", "csv"))

    return result

@api_router.post("/admin/feeds/sync-all")
async def sync_all_feeds(background_tasks: BackgroundTasks, admin: str = Depends(verify_admin)):
    results = await run_all_syncs()
    return {"success": True, "results": results}

# Admin Routes - AliExpress Sync
@api_router.post("/admin/aliexpress/sync")
async def sync_aliexpress(
    keywords: Optional[str] = None,
    category_id: Optional[str] = None,
    sync_type: str = "hot",
    admin: str = Depends(verify_admin)
):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})

    if not settings or not settings.get("aliexpress_app_key"):
        raise HTTPException(status_code=400, detail="AliExpress API not configured")

    api = AliExpressAPI(
        app_key=settings["aliexpress_app_key"],
        app_secret=settings["aliexpress_app_secret"],
        tracking_id=settings["aliexpress_tracking_id"]
    )

    sync_log = SyncLog(platform="aliexpress", sync_type=sync_type)
    await db.sync_logs.insert_one(sync_log.model_dump())

    try:
        if sync_type == "hot":
            ae_products = await api.get_hot_products(category_id)
        else:
            if not keywords:
                raise HTTPException(status_code=400, detail="Keywords required for search sync")
            ae_products = await api.search_products(keywords, category_id)

        feed_products = [transform_aliexpress_product(p) for p in ae_products]
        imported, updated = await import_feed_products(feed_products, "aliexpress")

        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "completed",
                "products_synced": imported + updated,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        await update_category_counts()

        return {
            "success": True,
            "sync_id": sync_log.id,
            "products_synced": imported + updated
        }

    except Exception as e:
        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {"status": "failed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/sync/logs")
async def get_sync_logs(limit: int = 20, admin: str = Depends(verify_admin)):
    logs = await db.sync_logs.find({}, {"_id": 0}).sort("started_at", -1).limit(limit).to_list(limit)
    return logs

# Admin Routes - Settings
@api_router.get("/admin/settings")
async def get_settings(admin: str = Depends(verify_admin)):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})
    if settings:
        if settings.get("aliexpress_app_secret"):
            settings["aliexpress_app_secret"] = "***" + settings["aliexpress_app_secret"][-4:]
        if settings.get("temu_api_key"):
            settings["temu_api_key"] = "***" + settings["temu_api_key"][-4:]
        if settings.get("shein_api_key"):
            settings["shein_api_key"] = "***" + settings["shein_api_key"][-4:]
    return settings or {}

@api_router.post("/admin/settings")
async def update_settings(settings: APISettings, admin: str = Depends(verify_admin)):
    settings_dict = settings.model_dump(exclude_none=True)
    settings_dict["type"] = "api"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.settings.update_one(
        {"type": "api"},
        {"$set": settings_dict},
        upsert=True
    )

    return {"success": True, "message": "Settings updated"}

# Site Settings
@api_router.get("/admin/site-settings")
async def get_site_settings(admin: str = Depends(verify_admin)):
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    return settings or {"contact_email": None, "site_name": "GLOBAL", "footer_text": None}

@api_router.post("/admin/site-settings")
async def update_site_settings(settings: SiteSettings, admin: str = Depends(verify_admin)):
    settings_dict = settings.model_dump(exclude_none=True)
    settings_dict["type"] = "site"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.settings.update_one(
        {"type": "site"},
        {"$set": settings_dict},
        upsert=True
    )

    return {"success": True, "message": "Site settings updated"}

# Public site settings
@api_router.get("/site-settings")
async def get_public_site_settings():
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    return settings or {"contact_email": None, "site_name": "GLOBAL", "footer_text": None}

@api_router.get("/admin/auth-check")
async def admin_auth_check(admin: str = Depends(verify_admin)):
    return {"authenticated": True, "user": admin}

# Stats
@api_router.get("/admin/stats")
async def get_stats(admin: str = Depends(verify_admin)):
    total_products = await db.products.count_documents({})

    pipeline = [
        {"$unwind": "$prices"},
        {"$group": {"_id": "$prices.platform", "count": {"$sum": 1}}}
    ]
    platform_stats = await db.products.aggregate(pipeline).to_list(10)

    recent_imports = await db.feed_imports.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_syncs = await db.sync_logs.find({}, {"_id": 0}).sort("started_at", -1).limit(5).to_list(5)

    return {
        "total_products": total_products,
        "products_by_platform": {s["_id"]: s["count"] for s in platform_stats},
        "recent_imports": recent_imports,
        "recent_syncs": recent_syncs
    }

# =============== HELPER FUNCTIONS ===============

async def update_category_counts():
    pipeline = [
        {"$group": {"_id": "$category_slug", "count": {"$sum": 1}}}
    ]
    counts = await db.products.aggregate(pipeline).to_list(100)

    for c in counts:
        await db.categories.update_one(
            {"slug": c["_id"]},
            {"$set": {"product_count": c["count"]}}
        )

async def seed_categories():
    categories = [
        {"id": "cat-1", "name": "Electronics", "name_tr": "Elektronik", "slug": "electronics", "image": "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=400", "product_count": 0},
        {"id": "cat-2", "name": "Fashion", "name_tr": "Moda", "slug": "fashion", "image": "https://images.unsplash.com/photo-1763551229518-4a529c865e00?w=400", "product_count": 0},
        {"id": "cat-3", "name": "Home & Garden", "name_tr": "Ev & Bahçe", "slug": "home-garden", "image": "https://images.unsplash.com/photo-1761330439781-7919703f17ef?w=400", "product_count": 0},
        {"id": "cat-4", "name": "Beauty", "name_tr": "Güzellik", "slug": "beauty", "image": "https://images.unsplash.com/photo-1643168343047-f1056f97e555?w=400", "product_count": 0},
        {"id": "cat-5", "name": "Sports", "name_tr": "Spor", "slug": "sports", "image": "https://images.pexels.com/photos/4397840/pexels-photo-4397840.jpeg?w=400", "product_count": 0},
        {"id": "cat-6", "name": "Toys", "name_tr": "Oyuncak", "slug": "toys", "image": "https://images.pexels.com/photos/3661193/pexels-photo-3661193.jpeg?w=400", "product_count": 0},
        {"id": "cat-7", "name": "Bags", "name_tr": "Çanta", "slug": "bags", "image": "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?w=400", "product_count": 0},
        {"id": "cat-8", "name": "Jewelry", "name_tr": "Takı", "slug": "jewelry", "image": "https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?w=400", "product_count": 0},
    ]
    await db.categories.insert_many(categories)
    return categories

async def seed_demo_products():
    # Demo ürünler buraya gelecek (Senin orijinal kodundaki demo listesi)
    pass

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
