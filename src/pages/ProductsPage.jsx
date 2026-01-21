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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tüm 6 dil için hata mesajları sözlüğü
  const errorMessages = {
    tr: "Ürünler yüklenirken bir hata oluştu.",
    fr: "Erreur lors du chargement des produits.",
    de: "Fehler beim Laden der Produkte.",
    it: "Errore durante il caricamento dei prodotti.",
    es: "Error al cargar los productos.",
    nl: "Fout bij het laden van producten.",
    en: "Error loading products."
  };

  const fetchProducts = useCallback(async () => {
    if (!API) {
      setError("API URL configuration missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // API'ye dili de gönderiyoruz ki backend ona göre doğru isimleri göndersin
      const url = categorySlug
        ? `${API}/products?category=${categorySlug}&lang=${language}`
        : `${API}/products?lang=${language}`;

      const res = await axios.get(url);
      
      // Veri yapısı kontrolü: res.data doğrudan dizi mi yoksa bir nesne içinde mi?
      const data = res.data?.products || (Array.isArray(res.data) ? res.data : []);
      setProducts(data);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(errorMessages[language] || errorMessages['fr']);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [categorySlug, language]);

  const fetchCategories = useCallback(async () => {
    if (!API) return;
    try {
      const res = await axios.get(`${API}/categories?lang=${language}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  }, [language]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] rounded-2xl bg-gray-100" />
            <Skeleton className="h-4 w-3/4 bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-['Outfit']">
          {categorySlug
            ? (t('category_products') || 'Produits')
            : (t('all_products') || 'Tous les produits')}
        </h1>
        <Link to="/">
          <Button variant="ghost" className="hover:bg-orange-50 text-orange-600 font-semibold">
            ← {t('back_home') || 'Retour'}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products?.length > 0 ? (
          products.map((product) => (
            <ProductCard 
              key={product.id || `p-${Math.random()}`} 
              product={product} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-32 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg font-medium">
              {error || (language === 'tr' ? "Ürün bulunamadı." : "Aucun produit trouvé.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
