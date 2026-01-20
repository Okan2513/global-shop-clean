import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Üst bar metinleri (7 Dil)
  const topBarText = {
    tr: "AliExpress, Temu ve Shein'den en uygun fiyatları anında karşılaştır!",
    fr: "Comparez instantanément les meilleurs prix d'AliExpress, Temu et Shein !",
    de: "Vergleichen Sie sofort die besten Preise von AliExpress, Temu und Shein!",
    it: "Confronta istantaneamente i migliori prezzi di AliExpress, Temu e Shein!",
    es: "¡Compara al instante los mejores precios de AliExpress, Temu y Shein!",
    nl: "Vergelijk direct de beste prijzen van AliExpress, Temu en Shein!",
    en: "Instantly compare the best prices from AliExpress, Temu, and Shein!"
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Üst Bilgi Çubuğu */}
      <div className="bg-[#FB7701] text-white py-2 text-center text-[10px] md:text-xs font-medium px-4">
        {topBarText[language] || topBarText['en']}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* LOGO ALANI - İstediğin Yapı */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative flex items-center justify-center w-10 h-10 bg-[#FB7701] rounded-xl shadow-md group-hover:rotate-3 transition-transform">
               <Globe className="text-white h-6 w-6" />
               <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                 <Search className="h-3 w-3 text-[#FB7701]" />
               </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tighter text-gray-900 font-['Outfit'] uppercase">
                GLOBAL
              </span>
              <span className="text-[10px] font-bold text-[#FB7701] tracking-[0.1em] uppercase">
                Compare & Save
              </span>
            </div>
          </Link>

          {/* Arama Çubuğu */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder={language === 'tr' ? "Ürün ara..." : "Rechercher des produits..."}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#FB7701] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </form>

          {/* Sağ Aksiyonlar */}
          <div className="flex items-center gap-2 md:gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-bold bg-gray-50 border rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-[#FB7701]"
            >
              <option value="fr">FR 🇫🇷</option>
              <option value="tr">TR 🇹🇷</option>
              <option value="de">DE 🇩🇪</option>
              <option value="it">IT 🇮🇹</option>
              <option value="es">ES 🇪🇸</option>
              <option value="nl">NL 🇳🇱</option>
            </select>

            <Link to="/products" className="hidden sm:block">
              <Button variant="ghost" className="text-sm font-semibold text-gray-700">
                {language === 'tr' ? 'Ürünler' : 'Produits'}
              </Button>
            </Link>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
