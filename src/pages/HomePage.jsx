import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?limit=12&lang=${language}`),
        axios.get(`${API}/categories?lang=${language}`)
      ]);

      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (err) {
      console.error('HomePage fetch error:', err);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
