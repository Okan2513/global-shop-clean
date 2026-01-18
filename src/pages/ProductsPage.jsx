import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const productsUrl = categorySlug
        ? `${API}/products?category=${categorySlug}&lang=${language}`
        : `${API}/products?lang=${language}`;

      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(productsUrl),
        axios.get(`${API}/categories?lang=${language}`)
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, language]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {categorySlug
              ? categories.find(c => c.slug === categorySlug)?.name || t('products')
              : t('products')}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'tr'
              ? 'En uygun fiyatlı ürünleri keşfet'
              : 'Discover the best priced products'}
          </p>
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/products"
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              !categorySlug
                ? 'bg-[#FB7701] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all')}
          </Link>

          {categories.map(category => (
            <Link
              key={category.id}
              to={`/products/${category.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                categorySlug === category.slug
                  ? 'bg-[#FB7701] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {language === 'tr' && category.name_tr
                ? category.name_tr
                : category.name}
            </Link>
          ))}
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {language === 'tr'
              ? 'Bu kategoride ürün bulunamadı.'
              : 'No products found in this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
