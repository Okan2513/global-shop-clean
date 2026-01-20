import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

// Backend URL'i yoksa hata vermemesi için fallback ekledik
const API = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL}/api` 
  : 'https://backend-linkin-buraya-gelecek.com/api';

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fiyatları Euro ve Fransa formatına (1.234,56 €) çeviren fonksiyon
  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = categorySlug
        ? `${API}/products?category=${categorySlug}&lang=${language}`
        : `${API}/products?lang=${language}`;

      const res = await axios.get(url);
      
      // ÖNEMLİ: Gelen verinin array olup olmadığını kontrol ediyoruz
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        console.error('API array dönmedi:', res.data);
        setProducts([]); // Hata gelirse boş liste set et ki .map patlamasın
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Veriler yüklenirken bir hata oluştu.');
      setProducts([]); // Çökmeyi engellemek için
    } finally {
      setLoading(false);
    }
  }, [categorySlug, language]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/categories?lang=${language}`);
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [language]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Yükleme ekranı
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {categorySlug
            ? t('category_products') || 'Produits de catégorie'
            : t('all_products') || 'Tous les produits'}
        </h1>
        <Link to="/">
          <Button variant="outline">
            {t('back_home') || 'Retour à l\'accueil'}
          </Button>
        </Link>
      </div>

      {/* Ürün Listeleme Alanı */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.isArray(products) && products.length > 0 ? (
          products.map((product) => (
            // ProductCard'a fiyatı Euro formatında gönderiyoruz
            <ProductCard 
              key={product.id || Math.random()} 
              product={{
                ...product,
                displayPrice: formatEuro(product.price) 
              }} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
            <p className="text-gray-500">
              {error || "Henüz ürün bulunamadı veya API bağlantısı bekleniyor."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
