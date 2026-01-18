import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 text-gray-500">
        {language === 'tr'
          ? 'Ürün bulunamadı.'
          : 'Product not found.'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* BACK */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* IMAGE */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {product.title}
          </h1>

          <p className="text-gray-500 mb-6">
            {product.description}
          </p>

          {/* PRICE */}
          <div className="flex items-end gap-4 mb-6">
            <span className="text-3xl font-bold text-[#FB7701]">
              {product.price} {product.currency}
            </span>
            {product.old_price && (
              <span className="text-gray-400 line-through">
                {product.old_price} {product.currency}
              </span>
            )}
          </div>

          {/* PLATFORM */}
          <div className="mb-8">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gray-100">
              {product.platform}
            </span>
          </div>

          {/* CTA */}
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-[#FB7701] hover:bg-[#E66A00] rounded-full px-8"
            >
              {language === 'tr'
                ? 'Mağazaya Git'
                : 'Go to Store'}
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
