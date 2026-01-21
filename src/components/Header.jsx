import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ShoppingBag } from 'lucide-react'; // ShoppingBag eklendi
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Aktif bayrağı bulmak için
  const currentFlag = availableLanguages.find(l => l.code === language)?.flag || '🌐';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      {/* Üst Bilgi Barı */}
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] text-white py-2 text-center text-[11px] md:text-sm font-medium px-4">
        🎉 {t('hero_description')}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl md:text-3xl font-bold font-['Outfit'] shrink-0">
          <span className="text-[#FB7701]">GLO</span><span className="text-[#1A1A1A]">BAL</span>
        </Link>

        {/* Navigasyon Linkleri - EKLEDİM */}
        <nav className="hidden lg:flex items-center gap-6 ml-4">
          <Link 
            to="/products" 
            className="text-sm font-bold text-gray-700 hover:text-[#FB7701] transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            {t('all_products')}
          </Link>
        </nav>

        {/* Arama Barı */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <form onSubmit={handleSearch} className="w-full">
            <Input 
              placeholder={t('search_placeholder')} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-4 pr-12 rounded-full border-2 border-gray-100 focus:border-[#FB7701] transition-all" 
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#FB7701] hover:bg-[#e66d01] rounded-full h-9 w-9"
            >
              <Search className="h-4 w-4 text-white" />
            </Button>
          </form>
        </div>

        {/* Sağ Taraf: Dil Seçici ve Mobil Arama */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 border border-gray-100 rounded-full px-4 hover:bg-gray-50">
                <span className="text-lg">{currentFlag}</span>
                <span className="uppercase font-bold text-xs text-gray-700">{language}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            
            {/* Dil Menüsü İçeriği - DÜZELTTİM */}
            <DropdownMenuContent align="end" className="w-48 bg-white p-1 rounded-xl shadow-xl border-gray-100">
              {availableLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    language === lang.code ? 'bg-orange-50 text-[#FB7701]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {language === lang.code && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FB7701]" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobil İçin "Tüm Ürünler" İkonu */}
          <Link to="/products" className="lg:hidden p-2 text-gray-700">
            <ShoppingBag className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};
