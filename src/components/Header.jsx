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

const Header = () => {
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getCurrentLanguageInfo = () => {
    return availableLanguages.find(l => l.code === language) || availableLanguages[0];
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2 text-center text-sm font-medium">
        🎉 {t('hero_description')}
      </div>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex-shrink-0">
          <h1 className="text-3xl font-bold font-['Outfit']">
            <span className="text-[#FB7701]">GLO</span><span className="text-[#1A1A1A]">BAL</span>
          </h1>
        </Link>
        <div className="hidden md:flex flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative w-full">
            <Input
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-200"
            />
            <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] rounded-full h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="text-lg">{getCurrentLanguageInfo()?.flag}</span>
                <span className="uppercase font-medium">{language}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
