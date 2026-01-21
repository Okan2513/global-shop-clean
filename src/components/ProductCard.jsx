import { Link } from 'react-router-dom';
import { TrendingDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export const ProductCard = ({ product }) => {
  // t fonksiyonunu ekledik, labels sözlüğüne gerek kalmadı
  const { language, t } = useLanguage();

  // Avrupa (Euro) formatı: 1.234,56 €
  const formatPrice = (price) => {
    const localeMap = {
      en: 'en-GB', // İngilizce eklendi
      tr: 'tr-TR',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      es: 'es-ES',
      nl: 'nl-NL'
    };

    return new Intl.NumberFormat(localeMap[language] || 'en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  const getPlatformInfo = (platform) => {
    const p = platform?.toLowerCase();
    const platforms = {
      aliexpress: { name: 'AliExpress', bgColor: 'bg-[#FF4747]', icon: '🛒' },
      temu: { name: 'Temu', bgColor: 'bg-[#FF6000]', icon: '🏪' },
      shein: { name: 'Shein', bgColor: 'bg-black', icon: '👗' },
      amazon: { name: 'Amazon', bgColor: 'bg-[#232f3e]', icon: '📦' }
    };
    return platforms[p] || { name: platform || 'Store', bgColor: 'bg-gray-500', icon: '🏬' };
  };

  // Dinamik İsim: name_en, name_fr vb.
  const productName = product[`name_${language}`] || product.name_en || product.name;
  
  const sortedPrices = Array.isArray(product.prices) 
    ? [...product.prices].sort((a, b) => (a.price || 0) - (b.price || 0)) 
    : [];
    
  const cheapestPrice = sortedPrices[0];
  const maxPrice = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1].price : 0;
  const priceDifference = maxPrice > 0 ? maxPrice - (cheapestPrice?.price || 0) : 0;

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card group block border rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image || 'https://via.placeholder.com/300'}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        {product.discount_percent > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-red-600 text-white font-black px-2 py-1 rounded-lg border-none">
              -{product.discount_percent}%
            </Badge>
          </div>
        )}

        {priceDifference > 0 && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <TrendingDown className="h-3 w-3" />
              {/* Context'ten gelen çeviriyi kullanıyoruz */}
              {t('savings')} {formatPrice(priceDifference)}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center z-20">
          <span className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 bg-[#FB7701] text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl">
            {t('compare_prices')}
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
              {t('best_price')}
            </span>
            <span className="text-xl font-black text-emerald-600">
              {formatPrice(product.best_price || cheapestPrice?.price)}
            </span>
          </div>
          {cheapestPrice && (
            <div className={`${getPlatformInfo(cheapestPrice.platform).bgColor} px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase`}>
              {cheapestPrice.platform}
            </div>
          )}
        </div>

        <div className="space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {sortedPrices.slice(0, 3).map((p, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px] border-b border-gray-50 pb-1 last:border-0">
              <span className="text-gray-500 font-medium">{getPlatformInfo(p.platform).icon} {p.platform}</span>
              <span className="font-bold text-gray-700">{formatPrice(p.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
