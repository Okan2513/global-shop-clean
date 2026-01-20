import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2 text-center text-sm font-medium">
        🎉 {t('hero_description')}
      </div>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-3xl font-bold font-['Outfit']">
          <span className="text-[#FB7701]">GLO</span><span className="text-[#1A1A1A]">BAL</span>
        </Link>
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <form onSubmit={handleSearch} className="w-full">
            <Input placeholder={t('search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-4 pr-12 rounded-full border-2 border-gray-200" />
            <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] rounded-full h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
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
