import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/products/${id}?lang=${language}`
      );
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
      <div className="max-w-4xl mx-auto p-4">
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <p className="mb-4">{t('product_not_found') || 'Product not found'}</p>
        <Link to="/products">
          <Button>{t('back_to_products') || 'Back to products'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid md:grid-cols-2 gap-6">
        <img
          src={product.image}
          alt={product.name}
          className="w-full rounded-xl"
        />
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {language === 'tr' && product.name_tr ? product.name_tr : product.name}
          </h1>
          <p className="text-gray-600 mb-4">
            {language === 'tr' && product.description_tr
              ? product.description_tr
              : product.description}
          </p>

          <div className="mb-4">
            <span className="text-xl font-bold text-[#FB7701]">
              {product.best_price} $
            </span>
          </div>

          <a
            href={product.best_offer_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              {t('go_to_store') || 'Go to store'}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
