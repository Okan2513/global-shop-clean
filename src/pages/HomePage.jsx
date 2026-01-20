import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, Shield, Zap } from 'lucide-react';
// @ işaretlerini temizledik, standart yollara döndük
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

// Backend bağlantısı için güvenli yol
const API = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}/api` 
  : null;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchData();
  }, [language]);

  const fetchData = async () => {
    if (!API) {
      console.warn("REACT_APP_BACKEND_URL is not defined");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?limit=12&lang=${language}`),
        axios.get(`${API}/categories?lang=${language}`)
      ]);
      
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingDown,
      title: language === 'tr' ? 'En Ucuz Fiyat' : 'Meilleur Prix',
      description: language === 'tr' ? '3 platformu karşılaştır' : 'Comparez 3 plateformes'
    },
    {
      icon: Zap,
      title: language === 'tr' ? 'Otomatik Güncelleme' : 'Sync en Direct',
      description: language === 'tr' ? 'Fiyatlar anlık güncellenir' : 'Prix mis à jour en direct'
    }
  ];

  const getBentoClass = (index) => {
    const classes = ['col-span-2 row-span-2', 'col-span-1', 'col-span-1', 'row-span-2', 'col-span-1', 'col-span-2'];
    return classes[index % classes.length];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Emergent Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FB7701] via-[#FF8C00] to-[#FFD700] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold font-['Outfit'] mb-4">
                {language === 'tr' ? (
                  <>Fiyatları<br /><span className="text-[#1A1A1A]">Karşılaştır!</span></>
                ) : (
                  <>Comparez.<br /><span className="text-[#1A1A1A]">Achetez Malin!</span></>
                )}
              </h1>
              <p className="text-lg text-white/90 mb-8">
                {language === 'tr' 
                  ? 'AliExpress, Temu ve Shein ürünlerini anında kıyasla.'
                  : 'Comparez les prix d\'AliExpress, Temu et Shein instantanément.'}
              </p>
              <Link to="/products">
                <Button size="lg" className="bg-[#1A1A1A] text-white rounded-full px-8 py-6 font-bold">
                  {t('hero_cta') || 'Démarrer'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{t('categories') || 'Catégories'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px]">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className={`${getBentoClass(i)} rounded-2xl`} />)
            ) : (
              categories.slice(0, 6).map((cat, i) => (
                <Link key={cat.id} to={`/products/${cat.slug}`} className={`relative overflow-hidden rounded-2xl group ${getBentoClass(i)}`}>
                  <img src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" alt={cat.name} />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                    <h3 className="text-white font-bold">{language === 'tr' ? (cat.name_tr || cat.name) : cat.name}</h3>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
