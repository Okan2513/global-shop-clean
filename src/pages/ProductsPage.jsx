import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

const API = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}/api` 
  : null;

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!API) {
      setError("API URL configuration missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = categorySlug
        ? `${API}/products?category=${categorySlug}&lang=${language}`
        : `${API}/products?lang=${language}`;

      const res = await axios.get(url);
      
      // HATA KORUMASI: Gelen veri ne olursa olsun (null, obje, string) 
      // mutlaka bir diziye (Array) dönüştürülür. r.map hatasını bu satır engeller.
      const rawData = res.data?.products || res.data;
      const cleanData = Array.isArray(rawData) ? rawData : [];
      
      setProducts(cleanData);

    } catch (err) {
      console.error('Fetch error:', err);
      // Hata mesajlarını artık Context'teki t() fonksiyonundan alıyoruz
      setError(t('no_products_found'));
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [categorySlug, language, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] rounded-2xl bg-gray-100 w-full" />
            <Skeleton className="h-4 w-3/4 bg-gray-100" />
            <Skeleton className="h-4 w-1/2 bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">
          {categorySlug
            ? t('category_products')
            : t('all_products')}
        </h1>
        <Link to="/">
          <Button variant="ghost" className="hover:bg-orange-50 text-orange-600 font-semibold">
            ← {t('home')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard 
              key={product.id || Math.random()} 
              product={product} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-32 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg font-medium">
              {error || t('no_products_found')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
