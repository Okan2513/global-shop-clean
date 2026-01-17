import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Globe, ChevronDown, TrendingUp, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(`${API}/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
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

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    if (suggestion.category_slug) {
      navigate(`/products/${suggestion.category_slug}?search=${encodeURIComponent(suggestion.name)}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(suggestion.name)}`);
    }
    setSearchQuery('');
  };

  const handleCategoryClick = (category) => {
    setShowSuggestions(false);
    navigate(`/products/${category}`);
    setSearchQuery('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Bags', slug: 'bags' },
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
            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-200 focus:border-[#FB7701] focus:ring-2 focus:ring-[#FB7701]/20"
            data-testid={isMobile ? "mobile-search-input" : "search-input"}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] hover:bg-[#E66A00] rounded-full h-9 w-9"
            data-testid={isMobile ? "mobile-search-button" : "search-button"}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {showSuggestions && !isMobile && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {detectedCategory && (
            <div 
              className="px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => handleCategoryClick(detectedCategory)}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#FB7701]" />
                <span className="text-sm text-gray-600">{t('categories')}:</span>
                <span className="font-semibold text-[#FB7701] capitalize">
                  {detectedCategory.replace('-', ' ')}
                </span>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#FB7701] border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </div>
            </div>
          )}

          {suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-3"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{suggestion.category}</span>
                      {suggestion.best_platform && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="capitalize text-[#FB7701]">{suggestion.best_platform}</span>
                        </>
                      )}
                    </p>
                  </div>
                  {suggestion.best_price && (
                    <div className="flex-shrink-0">
                      <span className="text-sm font-bold text-green-600">
                        {formatPrice(suggestion.best_price)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !isSearching && searchQuery.length >= 2 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">{t('no_products_found')}</p>
            </div>
          ) : null}

          {suggestions.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={handleSearch}
                className="w-full text-center text-sm font-medium text-[#FB7701] hover:text-[#E66A00] flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {t('view_all')} "{searchQuery}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🎉 {t('hero_description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <h1 className="text-3xl font-bold font-['Outfit']">
              <span className="text-[#FB7701]">GLO</span>
              <span className="text-[#1A1A1A]">BAL</span>
            </h1>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchInput />
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 hover:bg-[#FB7701]/10 hover:text-[#FB7701]" 
                  data-testid="language-switcher"
                >
                  <span className="text-lg">{getCurrentLanguageInfo().flag}</span>
                  <span className="hidden sm:inline uppercase font-medium">{language}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)} 
                    className={`flex items-center gap-3 cursor-pointer ${language === lang.code ? 'bg-orange-50 text-[#FB7701]' : ''}`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="flex-1">{lang.name}</span>
                    {language === lang.code && (
                      <span className="text-[#FB7701]">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/products" className="hidden md:block">
              <Button variant="ghost" className="hover:bg-[#FB7701]/10 hover:text-[#FB7701]" data-testid="all-products-link">
                {t('all_products')}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="md:hidden mt-4">
          <SearchInput isMobile={true} />
        </div>
      </div>

      <nav className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 py-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/products/${cat.slug}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#FB7701] hover:bg-[#FB7701]/5 rounded-full transition-colors whitespace-nowrap"
                  data-testid={`category-link-${cat.slug}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[180px] bg-white z-40 overflow-y-auto">
          <nav className="p-4">
            <div className="space-y-2 mb-6">
              <Link
                to="/products"
                className="block px-4 py-3 text-gray-700 hover:bg-[#FB7701]/5 hover:text-[#FB7701] rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('all_products')}
              </Link>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2 px-4">{t('categories')}</h3>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/products/${cat.slug}`}
                    className="block px-4 py-3 text-gray-700 hover:bg-[#FB7701]/5 hover:text-[#FB7701] rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
