import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const navigate = useNavigate();

  // Dışarı tıklayınca önerileri kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Akıllı Arama Önerileri
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${API}/products/search/suggestions?q=${encodeURIComponent(searchQuery)}&lang=${language}`
          );
          setSuggestions(response.data.suggestions || []);
          setDetectedCategory(response.data.detected_category);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setDetectedCategory(null);
      setShowSuggestions(false);
    }
  }, [searchQuery, language]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // 🔧 KATEGORİ İSİMLERİNİ TEMİZLEYEN FONKSİYON
  const cleanCategoryName = (key, fallback) => {
    const translated = t(key);

    // Eğer çeviri yoksa ve cat_xxx geliyorsa fallback kullan
    if (!translated || translated === key) {
      return fallback;
    }

    return translated;
  };

  // 🔧 KATEGORİLER (ARTIK cat_ GÖRÜNMEYECEK)
  const categories = [
    { key: 'cat_electronics', fallback: 'Electronics', slug: 'electronics' },
    { key: 'cat_fashion', fallback: 'Fashion', slug: 'fashion' },
    { key: 'cat_home', fallback: 'Home & Garden', slug: 'home-garden' },
    { key: 'cat_beauty', fallback: 'Beauty', slug: 'beauty' },
    { key: 'cat_sports', fallback: 'Sports', slug: 'sports' },
    { key: 'cat_bags', fallback: 'Bags', slug: 'bags' },
  ];

  const getCurrentLanguageInfo = () => {
    return availableLanguages.find(l => l.code === language) || availableLanguages[0];
  };

  const SearchInput = ({ isMobile = false }) => (
    <div ref={!isMobile ? searchRef : null} className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-100 focus:border-[#FB7701] focus:ring-2 focus:ring-[#FB7701]/20"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] hover:bg-[#E66A00] rounded-full h-9 w-9 text-white"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {showSuggestions && !isMobile && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {suggestions.map((item, idx) => (
            <div 
              key={idx} 
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
              onClick={() => {
                navigate(`/products?search=${encodeURIComponent(item.name)}`);
                setShowSuggestions(false);
                setSearchQuery('');
              }}
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-orange-500 font-bold">{item.best_platform}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">

      {/* Üst Duyuru Barı */}
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">🎉 {t('hero_description')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* LOGO */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-3xl font-bold font-['Outfit']">
              <span className="text-[#FB7701]">GLO</span>
              <span className="text-[#1A1A1A]">BAL</span>
            </h1>
          </Link>

          {/* MASAÜSTÜ ARAMA */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchInput />
          </div>

          <div className="flex items-center gap-3">

            {/* DİL SEÇİCİ */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-[#FB7701]/10">
                  <span className="text-lg">{getCurrentLanguageInfo().flag}</span>
                  <span className="hidden sm:inline uppercase font-bold text-gray-700">{language}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-100 shadow-xl">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)} 
                    className={`flex items-center gap-3 cursor-pointer p-3 ${language === lang.code ? 'bg-orange-50 text-[#FB7701]' : ''}`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.name}</span>
                    {language === lang.code && <span className="text-[#FB7701]">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* TÜM ÜRÜNLER */}
            <Link to="/products" className="hidden md:block">
              <Button variant="ghost" className="hover:bg-[#FB7701]/10 hover:text-[#FB7701] font-bold text-gray-700">
                {t('all_products')}
              </Button>
            </Link>

            {/* MOBİL MENÜ */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

          </div>
        </div>

        {/* MOBİL ARAMA */}
        <div className="md:hidden mt-4">
          <SearchInput isMobile={true} />
        </div>
      </div>

      {/* MASAÜSTÜ KATEGORİLER */}
      <nav className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 py-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/products/${cat.slug}`}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#FB7701] hover:bg-[#FB7701]/5 rounded-full transition-colors whitespace-nowrap"
                >
                  {cleanCategoryName(cat.key, cat.fallback)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* MOBİL MENÜ İÇERİĞİ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[160px] bg-white z-[100] border-t overflow-y-auto animate-in slide-in-from-top duration-300">
          <div className="p-4 space-y-6">

            <div>
              <Link 
                to="/products" 
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl text-[#FB7701] font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5" />
                {t('all_products')}
              </Link>
            </div>
            
            <div className="space-y-1">
              <h3 className="px-4 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                {t('categories')}
              </h3>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products/${cat.slug}`}
                  className="block p-4 text-gray-700 font-semibold border-b border-gray-50 active:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cleanCategoryName(cat.key, cat.fallback)}
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
