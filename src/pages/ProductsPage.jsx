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

  // 🔥 CSV VE TEMU ÜRÜNLERİNİN BİRLEŞTİRİLMİŞ LİSTESİ
  const manualProducts = [
    {
      id: "temu-001",
      name: "Taşınabilir Mini Hava Nemlendirici",
      image: "https://p-amd-tmg.akamaized.net/obj/temu-tr/69d13c75-0e1d-4f1b-9d4a-38c2f1f1e1e1.jpg",
      category: "electronics",
      bestPrice: "145.50",
      bestStore: "Temu",
      prices: [
        { store: "temu", amount: "145.50", link: "https://temu.to/k/equk99nunrn", label: "ALLER À LA BOUTIQUE" },
        { store: "aliexpress", amount: "185.00", link: "https://s.click.aliexpress.com/e/_DloX", label: "ALLER À LA BOUTIQUE" },
        { store: "shein", amount: "179.99", link: "https://shein.com", label: "ALLER À LA BOUTIQUE" }
      ]
    },
    // CSV'DEN GELEN ÖRNEK ALİEXPRESS ÜRÜNLERİ (Buraya CSV'deki diğer ürünleri ekleyebilirsin)
    {
      id: "ali-1005006023348123",
      name: "Mini Projecteur LED Portable Home Cinéma",
      image: "https://ae01.alicdn.com/kf/S7f8a7e4b5d4e4b4b8b8b8b8b8b8b8b8b8.jpg",
      category: "electronics",
      bestPrice: "45.90",
      bestStore: "AliExpress",
      prices: [
        { store: "aliexpress", amount: "45.90", link: "https://s.click.aliexpress.com/e/_DloX", label: "ALLER À LA BOUTIQUE" },
        { store: "temu", amount: "55.00", link: "https://temu.to/k/equk99nunrn", label: "ALLER À LA BOUTIQUE" },
        { store: "shein", amount: "52.00", link: "https://shein.com", label: "ALLER À LA BOUTIQUE" }
      ]
    }
  ];

  useEffect(() => { fetchCategories(); }, [language]);
  useEffect(() => { fetchProducts(); }, [category, searchQuery, priceRange, selectedPlatforms, sortBy, language]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories?lang=${language}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Kategori hatası:", err); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await axios.get(`${API}/products?${params.toString()}`);
      let backendData = [];
      if (Array.isArray(res.data)) backendData = res.data;
      else if (Array.isArray(res.data.products)) backendData = res.data.products;

      // 🔥 Tüm verileri birleştir
      setProducts([...manualProducts, ...backendData]);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
      setProducts(manualProducts);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return t('all_products');
    const cat = categories.find(c => c.slug === category);
    return cat ? (cat[`name_${language}`] || cat.name) : category;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{t('categories')}</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/products/${cat.slug}`} className={`block px-3 py-2 rounded-lg ${category === cat.slug ? 'bg-[#FB7701]/10 text-[#FB7701]' : 'text-gray-600'}`}>
              {cat[`name_${language}`] || cat.name}
            </Link>
          ))}
        </div>
      </div>
      {/* Diğer filtreleri kodun orijinalindeki gibi buraya ekleyebilirsin */}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{getCategoryName()}</h1>
        </div>
        <div className="flex gap-8">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <FilterContent />
            </div>
          </aside>
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
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
