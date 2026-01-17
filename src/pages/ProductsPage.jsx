import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, Grid3X3, LayoutGrid, X } from 'lucide-react';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Checkbox } from '../components/ui/checkbox';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridSize, setGridSize] = useState('normal');
  
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [sortBy, setSortBy] = useState('popular');

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, searchQuery, priceRange, selectedPlatforms, sortBy, language]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?lang=${language}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
      if (selectedPlatforms.length > 0) params.append('platform', selectedPlatforms[0]);
      params.append('sort', sortBy);
      params.append('lang', language);
      params.append('limit', '50');

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return language === 'tr' ? 'Tüm Ürünler' : 'All Products';
    const cat = categories.find(c => c.slug === category);
    if (cat) return language === 'tr' && cat.name_tr ? cat.name_tr : cat.name;
    return category;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const platforms = ['aliexpress', 'temu', 'shein'];

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('categories')}</h4>
        <div className="space-y-2">
          <Link
            to="/products"
            className={`block px-3 py-2 rounded-lg transition-colors ${!category ? 'bg-[#FB7701]/10 text-[#FB7701] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t('all_products')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products/${cat.slug}`}
              className={`block px-3 py-2 rounded-lg transition-colors ${category === cat.slug ? 'bg-[#FB7701]/10 text-[#FB7701] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {language === 'tr' && cat.name_tr ? cat.name_tr : cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('price_range')}</h4>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={500} step={10} className="mb-4" />
        <div className="flex items-center gap-2">
          <Input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])} className="text-center text-sm" />
          <span className="text-gray-400">-</span>
          <Input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])} className="text-center text-sm" />
        </div>
        <p className="text-xs text-gray-500 mt-2">{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('platforms')}</h4>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <label key={platform} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedPlatforms.includes(platform)}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedPlatforms([...selectedPlatforms, platform]);
                  else setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                }}
              />
              <span className="capitalize text-sm text-gray-700">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => { setPriceRange([0, 500]); setSelectedPlatforms([]); }}>
        {t('clear_filters')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="breadcrumb mb-6">
          <Link to="/">{language === 'tr' ? 'Ana Sayfa' : 'Home'}</Link>
          <span>/</span>
          <Link to="/products">{t('all_products')}</Link>
          {category && (<><span>/</span><span className="text-gray-900">{getCategoryName()}</span></>)}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900">
              {searchQuery ? `"${searchQuery}"` : getCategoryName()}
            </h1>
            <p className="text-gray-500 mt-1">{products.length} {t('products')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="sort-select">
                <SelectValue placeholder={t('sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t('popular')}</SelectItem>
                <SelectItem value="price_asc">{t('price_low_high')}</SelectItem>
                <SelectItem value="price_desc">{t('price_high_low')}</SelectItem>
                <SelectItem value="newest">{t('newest')}</SelectItem>
                <SelectItem value="discount">{t('biggest_discount')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <Button variant={gridSize === 'normal' ? 'default' : 'ghost'} size="icon" className={gridSize === 'normal' ? 'bg-[#FB7701] hover:bg-[#E66A00]' : ''} onClick={() => setGridSize('normal')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={gridSize === 'compact' ? 'default' : 'ghost'} size="icon" className={gridSize === 'compact' ? 'bg-[#FB7701] hover:bg-[#E66A00]' : ''} onClick={() => setGridSize('compact')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden" data-testid="mobile-filter-btn">
                  <Filter className="h-4 w-4 mr-2" />{t('filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>{t('filters')}</SheetTitle></SheetHeader>
                <div className="mt-6"><FilterContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {(selectedPlatforms.length > 0 || priceRange[0] > 0 || priceRange[1] < 500) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedPlatforms.map((platform) => (
              <span key={platform} className="inline-flex items-center gap-1 bg-[#FB7701]/10 text-[#FB7701] px-3 py-1 rounded-full text-sm font-medium">
                {platform}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))} />
              </span>
            ))}
            {(priceRange[0] > 0 || priceRange[1] < 500) && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 500])} />
              </span>
            )}
          </div>
        )}

        <div className="flex gap-8">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4">{t('filters')}</h3>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-4 ${gridSize === 'compact' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {[...Array(12)].map((_, i) => (<div key={i} className="space-y-3"><Skeleton className="aspect-square rounded-xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{language === 'tr' ? 'Ürün bulunamadı' : 'No products found'}</h3>
                <p className="text-gray-500 mb-4">{language === 'tr' ? 'Filtreleri değiştirerek tekrar deneyin' : 'Try adjusting your filters'}</p>
                <Button onClick={() => { setPriceRange([0, 500]); setSelectedPlatforms([]); }} className="bg-[#FB7701] hover:bg-[#E66A00]">{t('clear_filters')}</Button>
              </div>
            ) : (
              <div className={`grid gap-4 ${gridSize === 'compact' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {products.map((product) => (<ProductCard key={`list-${product.id}`} product={product} />))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
