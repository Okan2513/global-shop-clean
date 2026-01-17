import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ChevronRight, Share2, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { PriceComparison } from '../components/PriceComparison';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchProduct();
  }, [id, language]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/products/${id}?lang=${language}`);
      setProduct(response.data);

      const relatedRes = await axios.get(`${API}/products?category=${response.data.category_slug}&limit=5&lang=${language}`);
      setRelatedProducts(relatedRes.data.filter(p => p.id !== id).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error(language === 'tr' ? 'Ürün yüklenemedi' : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(language === 'tr' ? 'Link kopyalandı!' : 'Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'tr' ? 'Ürün bulunamadı' : 'Product not found'}</h2>
          <Link to="/products">
            <Button className="bg-[#FB7701] hover:bg-[#E66A00] mt-4">{t('all_products')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const productName = language === 'tr' && product.name_tr ? product.name_tr : product.name;
  const productDesc = language === 'tr' && product.description_tr ? product.description_tr : product.description;

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="breadcrumb mb-6">
          <Link to="/">{language === 'tr' ? 'Ana Sayfa' : 'Home'}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/products">{t('all_products')}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/products/${product.category_slug}`}>{product.category}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 truncate max-w-[200px]">{productName}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img src={product.image} alt={productName} className="w-full h-full object-cover" />
              {product.discount_percent && product.discount_percent > 0 && (
                <Badge className="absolute top-4 left-4 bg-[#E02424] text-white text-sm px-3 py-1">
                  -{product.discount_percent}%
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleShare} data-testid="share-btn">
                <Share2 className="h-5 w-5 mr-2" />
                {language === 'tr' ? 'Paylaş' : 'Share'}
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-gray-900 mb-3">{productName}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="font-semibold text-gray-800">{product.rating?.toFixed(1)}</span>
                <span className="text-gray-500">({product.reviews_count?.toLocaleString()} reviews)</span>
              </div>

              <div className="bg-gradient-to-r from-[#FB7701]/10 to-[#FFD700]/10 rounded-xl p-4 mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-[#FB7701]">{formatPrice(product.best_price)}</span>
                  {product.prices?.[0]?.original_price && product.prices[0].original_price > product.best_price && (
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.prices[0].original_price)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {t('best_price')} {t('from')} <span className="font-semibold capitalize">{product.best_platform}</span>
                </p>
              </div>
            </div>

            <PriceComparison prices={product.prices || []} bestPlatform={product.best_platform} />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                <Shield className="h-6 w-6 mx-auto mb-2 text-[#FB7701]" />
                <p className="text-xs font-medium text-gray-700">{language === 'tr' ? 'Güvenli' : 'Secure'}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                <Truck className="h-6 w-6 mx-auto mb-2 text-[#FB7701]" />
                <p className="text-xs font-medium text-gray-700">{language === 'tr' ? 'Hızlı Kargo' : 'Fast Ship'}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-[#FB7701]" />
                <p className="text-xs font-medium text-gray-700">{language === 'tr' ? 'Kolay İade' : 'Easy Return'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="description" className="bg-white rounded-2xl shadow-sm">
            <TabsList className="w-full justify-start border-b rounded-none px-4">
              <TabsTrigger value="description" className="data-[state=active]:text-[#FB7701]">{t('product_details')}</TabsTrigger>
            </TabsList>
            <div className="p-6">
              <TabsContent value="description" className="mt-0">
                <h3 className="font-semibold text-lg mb-3">{language === 'tr' ? 'Ürün Açıklaması' : 'Product Description'}</h3>
                <p className="text-gray-600 leading-relaxed">{productDesc}</p>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold font-['Outfit'] text-gray-900 mb-6">{t('similar_products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (<ProductCard key={`related-${p.id}`} product={p} />))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
