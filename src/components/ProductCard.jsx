import { Link } from 'react-router-dom';
import { Star, TrendingDown, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export const ProductCard = ({ product }) => {
  const { language, t } = useLanguage();

  // Fransa formatında Euro gösterimi için güncellendi
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const getPlatformInfo = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'aliexpress': 
        return { name: 'AliExpress', bgColor: 'bg-red-500', textColor: 'text-white', icon: '🛒' };
      case 'temu': 
        return { name: 'Temu', bgColor: 'bg-orange-500', textColor: 'text-white', icon: '🏪' };
      case 'shein': 
        return { name: 'Shein', bgColor: 'bg-black', textColor: 'text-white', icon: '👗' };
      default: 
        return { name: platform || 'Platform', bgColor: 'bg-gray-500', textColor: 'text-white', icon: '🏬' };
    }
  };

  const productName = language === 'tr' && product.name_tr ? product.name_tr : product.name;
  
  // Fiyatları sırala ve en ucuzu bul (Hata korumalı)
  const sortedPrices = Array.isArray(product.prices) 
    ? [...product.prices].sort((a, b) => a.price - b.price) 
    : [];
    
  const cheapestPrice = sortedPrices[0];
  const priceDifference = sortedPrices.length > 1 
    ? sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price 
    : 0;

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card group block border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image || 'https://via.placeholder.com/300'}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Discount Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount_percent > 0 && (
            <Badge className="bg-[#E02424] text-white text-xs font-bold px-2 py-1 shadow-md border-none">
              -{product.discount_percent}%
            </Badge>
          )}
        </div>

        {/* Best Platform Badge */}
        <div className="absolute top-2 right-2">
          {cheapestPrice && (
            <div className={`${getPlatformInfo(cheapestPrice.platform).bgColor} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1`}>
              <span>{getPlatformInfo(cheapestPrice.platform).icon}</span>
              <span className="uppercase">{cheapestPrice.platform}</span>
            </div>
          )}
        </div>

        {/* Price Savings Badge */}
        {priceDifference > 0 && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {language === 'tr' ? 'Kazanç:' : 'Économie:'} {formatPrice(priceDifference)}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">
            {t('compare_prices') || 'Comparer'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[40px] leading-snug">
          {productName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-gray-700">{product.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-[10px] text-gray-400">({product.reviews_count?.toLocaleString() || 0})</span>
        </div>

        {/* Best Price Highlight */}
        <div className="bg-emerald-50 rounded-xl p-3 mb-3 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
                {language === 'tr' ? 'En İyi Fiyat' : 'Meilleur Prix'}
              </span>
            </div>
            <span className="text-xl font-black text-emerald-600">
              {formatPrice(product.best_price)}
            </span>
          </div>
        </div>

        {/* Platform Comparison List */}
        <div className="space-y-2">
          {sortedPrices.slice(0, 3).map((p, idx) => {
            const platformInfo = getPlatformInfo(p.platform);
            const isLowest = idx === 0;
            
            return (
              <div
                key={p.platform + idx}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                  isLowest
                    ? 'bg-white border-2 border-emerald-400'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">{platformInfo.icon}</span>
                  <span className={`text-[11px] font-bold ${isLowest ? 'text-emerald-800' : 'text-gray-600'}`}>
                    {platformInfo.name}
                  </span>
                </div>
                <span className={`text-xs font-extrabold ${isLowest ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {formatPrice(p.price)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
};
