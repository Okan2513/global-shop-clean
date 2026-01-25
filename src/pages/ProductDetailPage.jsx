import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const getButtonText = () => {
    const texts = {
      tr: 'Mağazaya Git',
      fr: "Voir l'offre",
      de: 'Zum Shop',
      it: 'Vai allo store',
      es: 'Ir a la tienda',
      nl: 'Naar de winkel',
      en: 'Go to store'
    };
    return texts[language] || texts['en'];
  };

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/${id}?lang=${language}`);
      setProduct(res.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }, [id, language]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-10">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center">
        <p className="text-xl font-bold mb-6 italic text-gray-400">
          {language === 'tr' ? 'Ürün bulunamadı' : 'Produit non trouvé'}
        </p>
        <Link to="/products">
          <Button className="bg-[#FB7701]">{t('back_to_products') || 'Back'}</Button>
        </Link>
      </div>
    );
  }

  // 🔥 GERÇEK BACKEND REDIRECT – PLATFORM + PRODUCT ID
  const handleGoToStore = () => {
    const platform = product.best_platform;

    if (!platform) {
      alert("Platform bulunamadı");
      return;
    }

    window.open(
      `${process.env.REACT_APP_BACKEND_URL}/api/redirect/${product.id}/${platform}`,
      "_blank"
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <Link to="/products" className="inline-flex items-center text-sm text-gray-500 hover:text-[#FB7701] mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {language === 'tr' ? 'Geri Dön' : 'Retour'}
      </Link>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Ürün Görseli */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-auto rounded-2xl object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Ürün Bilgileri */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
            {language === 'tr' && product.name_tr ? product.name_tr : product.name}
          </h1>
          
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            {language === 'tr' && product.description_tr
              ? product.description_tr
              : product.description}
          </p>

          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mb-8">
            <span className="text-sm text-orange-600 font-bold uppercase tracking-wider block mb-1">
              {language === 'tr' ? 'En İyi Fiyat' : 'Meilleur Prix'}
            </span>
            <span className="text-4xl font-black text-[#FB7701]">
              {formatPrice(product.best_price)}
            </span>
          </div>

          <div className="space-y-4">
            {/* 🔥 ARTIK HREF YOK – BACKEND REDIRECT VAR */}
            <Button
              onClick={handleGoToStore}
              className="w-full bg-[#FB7701] hover:bg-[#E66A00] text-white py-8 rounded-2xl text-xl font-bold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3"
            >
              {getButtonText()}
              <ExternalLink className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <ShieldCheck className="h-4 w-4" />
              {language === 'tr' ? 'Güvenli yönlendirme' : 'Redirection sécurisée'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
