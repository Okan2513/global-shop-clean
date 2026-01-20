import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Globe, ChevronDown, TrendingUp, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GlobalHeader() {
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
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] hover:bg-[#E66A00] rounded-full h-9 w-9"
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
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">🎉 {t('hero_description')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-3xl font-bold font-['Outfit']">
              <span className="text-[#FB7701]">GLO</span>
              <span className="text-[#1A1A1A]">BAL</span>
            </h1>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchInput />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="text-lg">{getCurrentLanguageInfo().flag}</span>
                  <span className="hidden sm:inline uppercase font-medium">{language}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                    <span className="text-lg mr-2">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
