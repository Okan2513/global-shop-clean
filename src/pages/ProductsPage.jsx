import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../components/ui/sheet';
import { Checkbox } from '../components/ui/checkbox';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

/* 🔥 BACKEND URL – ENV YOKSA DİREKT RENDER */
const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;

export default function ProductsPage() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [sortBy, setSortBy] = useState('popular');

  const searchQuery = searchParams.get('search') || '';

  /* 🔥 KATEGORİLER */
  useEffect(() => {
    fetchCategories();
  }, [language]);

  /* 🔥 ÜRÜNLER */
  useEffect(() => {
    fetchProducts();
  }, [category, searchQuery, priceRange, selectedPlatforms, sortBy, language]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories?lang=${language}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Kategori hatası:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0]);
      if (priceRange[1] < 500) params.append('max_price', priceRange[1]);

      /* 🔥 ÇOKLU PLATFORM FİLTRESİ */
      if (selectedPlatforms.length > 0) {
        selectedPlatforms.forEach(p => params.append('platform', p));
      }

      params.append('sort', sortBy);
      params.append('lang', language);

      const res = await axios.get(`${API}/products?${params.toString()}`);

      /* 🔥 BACKEND UYUMLULUK – HER FORMAT DESTEK */
      let data = [];

      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res.data.products)) {
        data = res.data.products;
      }

      setProducts(data);
    } catch (err) {
      console.error("Ürün çekme hatası:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return t('all_products');
    const cat = categories.find(c => c.slug === category);
    if (cat) return cat[`name_${language}`] || cat.name_tr || cat.name;
    return category;
  };

  const platforms = ['aliexpress', 'temu', 'shein', 'amazon'];

  /* 🔥 SOL FİLTRE PANELİ */
  const FilterContent = () => (
    <div className="space-y-6">

      {/* KATEGORİLER */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('categories')}</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products/${cat.slug}`}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                category === cat.slug
                  ? 'bg-[#FB7701]/10 text-[#FB7701] font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat[`name_${language}`] || cat.name_tr || cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* FİYAT */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('price_range')}</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={500}
          step={10}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
            className="text-center text-sm"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
            className="text-center text-sm"
          />
        </div>
      </div>

      {/* PLATFORMLAR */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('platforms')}</h4>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <label key={platform} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedPlatforms.includes(platform)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPlatforms([...selectedPlatforms, platform]);
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                  }
                }}
              />
              <span className="capitalize text-sm text-gray-700">{platform}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* BAŞLIK */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {searchQuery ? `"${searchQuery}"` : getCategoryName()}
            </h1>
            <p className="text-gray-500 mt-1">
              {products.length} {t('products')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t('popular')}</SelectItem>
                <SelectItem value="price_asc">{t('price_low_high')}</SelectItem>
                <SelectItem value="price_desc">{t('price_high_low')}</SelectItem>
              </SelectContent>
            </Select>

            {/* MOBİL FİLTRE */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="h-4 w-4 mr-2" />{t('filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="mt-6"><FilterContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">

          {/* SOL PANEL */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* ÜRÜN LİSTESİ */}
          <div className="flex-1">

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
                <p className="text-gray-500">{t('no_products_found')}</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
