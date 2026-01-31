import { useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
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

const SearchInput = memo(({ 
  searchQuery, 
  setSearchQuery, 
  handleSearch, 
  showSuggestions, 
  setShowSuggestions, 
  suggestions, 
  navigate, 
  t, 
  isMobile = false 
}) => {

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Input
            type="text"
            placeholder={t('search_placeholder') || 'Search product...'}
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
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                navigate(`/products?search=${encodeURIComponent(item.name)}`);
                setShowSuggestions(false);
                setSearchQuery('');
              }}
            >
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${API}/products/search/suggestions?q=${encodeURIComponent(searchQuery)}&lang=${language}`
          );
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, language]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">

      {/* 🔥 CLEAN TOP BAR */}
      <div className="bg-[#FB7701] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-wide">
            One Site — Multiple Platforms
          </p>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* LOGO */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-3xl font-bold font-['Outfit']">
              <span className="text-[#FB7701]">GLO</span>
              <span className="text-[#1A1A1A]">BAL</span>
            </h1>
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchInput 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              suggestions={suggestions}
              navigate={navigate}
              t={t}
            />
          </div>

          {/* LANGUAGE + MOBILE MENU */}
          <div className="flex items-center gap-3">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-[#FB7701]/10">
                  <span className="text-lg">
                    {availableLanguages.find(l => l.code === language)?.flag || '🌐'}
                  </span>
                  <span className="hidden sm:inline uppercase font-bold text-gray-700">
                    {language}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-100 shadow-xl">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className="cursor-pointer"
                  >
                    {lang.flag} {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="md:hidden mt-4">
          <SearchInput 
            isMobile
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            navigate={navigate}
            t={t}
          />
        </div>
      </div>
    </header>
  );
};
