import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

// Backend URL güvenliği sağlandı
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

  // Avrupa Standartlarında Fiyat Formatı (Fransa, Almanya, Hollanda vb. için uygun)
  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const fetchProducts = useCallback(async () => {
    if (!API) {
      setError("Bağlantı ayarları eksik.");
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
      
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      // Hata mesajını dile göre dinamik yapıyoruz
      const errorMsg = {
        tr: "Ürünler yüklenirken bir hata oluştu.",
        fr: "Erreur lors du chargement des produits.",
        de: "Fehler beim Laden der Produkte.",
        it: "Errore durante il caricamento dei prodotti.",
        es: "Error al cargar los productos.",
        nl: "Fout bij het laden van producten."
      };
      setError(errorMsg[language] || errorMsg['fr']);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, language]);

  const fetchCategories = useCallback(async () => {
    if (!API) return;
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] rounded-2xl bg-gray-200" />
            <Skeleton className="h-4 w-3/4 bg-gray-200" />
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
            ? t('category_products') || 'Produits de catégorie'
            : t('all_products') || 'Tous les produits'}
        </h1>
        <Link to="/">
          <Button variant="ghost" className="hover:bg-orange-50 text-orange-600 font-semibold">
            ← {t('back_home') || 'Retour'}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard 
              key={product.id || Math.random()} 
              product={{
                ...product,
                // Hem fiyatı hem de mağaza buton yazısını dile duyarlı hale getiriyoruz
                displayPrice: formatEuro(product.price),
                buttonText: t('go_to_store') // Bu anahtar LanguageContext'te olmalı
              }} 
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
