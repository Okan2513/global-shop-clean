import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import { useLanguage } from "../contexts/LanguageContext";

// İsimleri eşitledik: Artık her iki sayfa da aynı değişkene bakıyor
const RAW_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const API_BASE_URL = RAW_BASE_URL 
  ? `${RAW_BASE_URL.replace(/\/$/, "")}/api` 
  : null;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t, language } = useLanguage();

  const fetchData = useCallback(async () => {
    if (!API_BASE_URL) {
      console.error("REACT_APP_BACKEND_URL tanımlı değil");
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Ana sayfa için en popüler veya rastgele ürünleri çekiyoruz
      const res = await axios.get(`${API_BASE_URL}/products?lang=${language}`);
      if (Array.isArray(res.data)) {
        setProducts(res.data.slice(0, 8)); // İlk 8 ürünü göster
      }
      setError(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          {t('popular_products') || 'Produits Populaires'}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
            <p className="font-semibold">
              {language === 'tr' 
                ? 'API bağlantısı yok (Backend adresi eksik)' 
                : 'Erreur de connexion API (Adresse backend manquante)'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
