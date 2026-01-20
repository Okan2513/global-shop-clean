import { Link } from 'react-router-dom';
import { Star, TrendingDown, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export const ProductCard = ({ product }) => {
  const { language, t } = useLanguage();

  // Avrupa (Euro) formatı: 1.234,56 €
  const formatPrice = (price) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const getPlatformInfo = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'aliexpress': 
        return { name: 'AliExpress', bgColor: 'bg-[#FF4747]', textColor: 'text-white', icon: '🛒' };
      case 'temu': 
        return { name: 'Temu', bgColor: 'bg-[#FF6000]', textColor: 'text-white', icon: '🏪' };
      case 'shein': 
        return { name: 'Shein', bgColor: 'bg-black', textColor: 'text-white', icon: '👗' };
      default: 
        return { name: platform || 'Platform', bgColor: 'bg-gray-500', textColor: 'text-white', icon: '🏬' };
    }
  };

  const productName = language === 'tr' && product.name_tr ? product.name_tr : product.name;
  
  const sortedPrices = Array.isArray(product.prices) 
    ? [...product.prices].sort((a, b) => a.price - b.price) 
    : [];
    
  const cheapestPrice = sortedPrices[0];
  const priceDifference = sortedPrices.length > 1 
    ? sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price 
    : 0;

  // Çok dilli etiketler sözlüğü
  const labels = {
    savings: { tr: 'Kazanç:', fr: 'Économie:', de: 'Ersparnis:', it: 'Risparmio:', es: 'Ahorro:', nl: 'Besparing:' },
    bestPrice: { tr: 'En İyi Fiyat', fr: 'Meilleur Prix', de: 'Bester Preis', it: 'Miglior Prezzo', es: 'Mejor Precio', nl: 'Beste Prijs' },
    compare: { tr: 'Karşılaştır', fr: 'Comparer', de: 'Vergleichen', it: 'Confronta', es: 'Comparar', nl: 'Vergelijken' }
  };

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card group block border rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image || 'https://via.placeholder.com/300'}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        
        {product.discount_percent > 0 && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600 text-white font-black px-2 py-1 rounded-lg">
              -{product.discount_percent}%
            </Badge>
          </div>
        )}

        {priceDifference > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <TrendingDown className="h-3 w-3" />
              {labels.savings[language] || labels.savings.fr} {formatPrice(priceDifference)}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 bg-[#FB7701] text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl">
            {labels.compare[language] || labels.compare.fr}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 min-h-[40px] leading-tight group-hover:text-[#FB7701] transition-colors">
          {productName}
        </h3>

        <div className="bg-emerald-50 rounded-xl p-3 mb-4 border border-emerald-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
              {labels.bestPrice[language] || labels.bestPrice.fr}
            </span>
            <span className="text-xl font-black text-emerald-600">
              {formatPrice(product.best_price)}
            </span>
          </div>
          {cheapestPrice && (
            <div className={`${getPlatformInfo(cheapestPrice.platform).bgColor} px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase`}>
              {cheapestPrice.platform}
            </div>
          )}
        </div>

        {/* Küçük platform karşılaştırması */}
        <div className="space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {sortedPrices.slice(0, 3).map((p, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500 font-medium">{getPlatformInfo(p.platform).icon} {p.platform}</span>
              <span className="font-bold text-gray-700">{formatPrice(p.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
