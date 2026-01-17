import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?limit=12&lang=${language}`),
        axios.get(`${API}/categories?lang=${language}`)
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingDown,
      title: language === 'tr' ? 'En Ucuz Fiyat' : 'Best Prices',
      description: language === 'tr' ? '3 platformu karşılaştır' : 'Compare 3 platforms'
    },
    {
      icon: Zap,
      title: language === 'tr' ? 'Otomatik Güncelleme' : 'Auto Updates',
      description: language === 'tr' ? 'Fiyatlar anlık güncellenir' : 'Real-time sync'
    },
    {
      icon: Shield,
      title: language === 'tr' ? 'Güvenli Alışveriş' : 'Safe Shopping',
      description: language === 'tr' ? 'Orijinal mağazalara yönlendirim' : 'Direct to stores'
    }
  ];

  const getBentoClass = (index) => {
    const classes = ['col-span-2 row-span-2', '', '', 'row-span-2', '', 'col-span-2', '', ''];
    return classes[index % classes.length];
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FB7701] via-[#FF8C00] to-[#FFD700] py-16 md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold font-['Outfit'] leading-tight mb-4">
                {language === 'tr' ? (
                  <>Fiyatları<br /><span className="text-[#1A1A1A]">Karşılaştır!</span></>
                ) : (
                  <>Compare Prices.<br /><span className="text-[#1A1A1A]">Shop Smarter!</span></>
                )}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
                {language === 'tr' 
                  ? 'AliExpress, Temu ve Shein\'den en uygun fiyatları anında karşılaştır. Akıllı alışveriş, akıllı tasarruf!'
                  : 'Compare prices from AliExpress, Temu, and Shein instantly. Smart shopping, smart savings!'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button 
                    size="lg" 
                    className="bg-[#1A1A1A] hover:bg-black text-white rounded-full px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                    data-testid="hero-shop-now-btn"
                  >
                    {t('hero_cta')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              {/* Platform badges */}
              <div className="flex gap-3 mt-8">
                <span className="platform-badge platform-aliexpress text-sm">AliExpress</span>
                <span className="platform-badge platform-temu text-sm">Temu</span>
                <span className="platform-badge platform-shein text-sm">Shein</span>
              </div>
            </div>

            <div className="hidden md:block">
              <img
                src="https://images.pexels.com/photos/5868130/pexels-photo-5868130.jpeg?w=600"
                alt="Happy Shopper"
                className="rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="bg-[#FB7701]/10 p-2 rounded-full">
                  <feature.icon className="h-5 w-5 text-[#FB7701]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{feature.title}</p>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="py-12 md:py-16" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900">
                {t('categories')}
              </h2>
              <p className="text-gray-500 mt-1">
                {language === 'tr' ? 'İhtiyacın olan her şey burada' : 'Everything you need is here'}
              </p>
            </div>
            <Link 
              to="/products"
              className="hidden md:flex items-center gap-2 text-[#FB7701] font-semibold hover:gap-3 transition-all"
            >
              {t('view_all')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[150px] gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className={`${getBentoClass(i)} rounded-2xl`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[150px] gap-4">
              {categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products/${category.slug}`}
                  className={`category-card ${getBentoClass(index)}`}
                  data-testid={`category-card-${category.slug}`}
                >
                  <img
                    src={category.image}
                    alt={language === 'tr' && category.name_tr ? category.name_tr : category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="text-white font-bold text-lg md:text-xl font-['Outfit']">
                      {language === 'tr' && category.name_tr ? category.name_tr : category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category.product_count?.toLocaleString()} {t('products')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-12 md:py-16" data-testid="products-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900">
                {language === 'tr' ? 'Popüler Ürünler' : 'Popular Products'}
              </h2>
              <p className="text-gray-500 mt-1">
                {language === 'tr' ? 'En çok karşılaştırılan ürünler' : 'Most compared products'}
              </p>
            </div>
            <Link 
              to="/products"
              className="hidden md:flex items-center gap-2 text-[#FB7701] font-semibold hover:gap-3 transition-all"
            >
              {t('view_all')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {loading ? (
            <div className="product-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={`home-${product.id}`} product={product} />
              ))}
            </div>
          )}

          {/* Mobile View All */}
          <div className="mt-8 md:hidden text-center">
            <Link to="/products">
              <Button className="bg-[#FB7701] hover:bg-[#E66A00] rounded-full px-8">
                {t('view_all')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-white mb-4">
            {language === 'tr' ? 'Daha İyi Fiyatları Kaçırma!' : "Don't Miss Better Prices!"}
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            {language === 'tr' 
              ? 'GLOBAL ile binlerce ürünü karşılaştır, en uygun fiyatı bul!'
              : 'Compare thousands of products with GLOBAL and find the best deals!'}
          </p>
          <Link to="/products">
            <Button 
              size="lg"
              className="bg-[#FB7701] hover:bg-[#E66A00] rounded-full px-8 py-6 text-lg font-bold"
              data-testid="cta-btn"
            >
              {t('hero_cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
