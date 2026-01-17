import { Link } from 'react-router-dom';
import { Star, TrendingDown, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export const ProductCard = ({ product }) => {
  const { language, t } = useLanguage();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getPlatformInfo = (platform) => {
    switch (platform) {
      case 'aliexpress': 
        return { name: 'AliExpress', bgColor: 'bg-red-500', textColor: 'text-white', icon: '🛒' };
      case 'temu': 
        return { name: 'Temu', bgColor: 'bg-orange-500', textColor: 'text-white', icon: '🏪' };
      case 'shein': 
        return { name: 'Shein', bgColor: 'bg-black', textColor: 'text-white', icon: '👗' };
      default: 
        return { name: platform, bgColor: 'bg-gray-500', textColor: 'text-white', icon: '🏬' };
    }
  };

  const productName = language === 'tr' && product.name_tr ? product.name_tr : product.name;
  
  // Sort prices to find cheapest
  const sortedPrices = [...(product.prices || [])].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0];
  const priceDifference = sortedPrices.length > 1 
    ? sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price 
    : 0;

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card group block"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Discount Badge - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount_percent && product.discount_percent > 0 && (
            <Badge className="bg-[#E02424] text-white text-xs font-bold px-2 py-1 shadow-md">
              -{product.discount_percent}%
            </Badge>
          )}
        </div>

        {/* Best Platform Badge - Top Right */}
        <div className="absolute top-2 right-2">
          {cheapestPrice && (
            <div className={`${getPlatformInfo(cheapestPrice.platform).bgColor} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1`}>
              <span>{getPlatformInfo(cheapestPrice.platform).icon}</span>
              <span className="uppercase">{cheapestPrice.platform}</span>
            </div>
          )}
        </div>

        {/* Price Savings Badge - Bottom Left */}
        {priceDifference > 0 && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {language === 'tr' ? 'Tasarruf' : 'Save'} {formatPrice(priceDifference)}
            </div>
          </div>
        )}

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#FB7701] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {t('compare_prices')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px] group-hover:text-[#FB7701] transition-colors">
          {productName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{product.rating?.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({product.reviews_count?.toLocaleString()})</span>
        </div>

        {/* Best Price Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 mb-2 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[10px] font-semibold text-green-700 uppercase">
                {language === 'tr' ? 'En İyi Fiyat' : 'Best Price'}
              </span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(product.best_price)}
            </span>
          </div>
          {product.prices?.[0]?.original_price && product.prices[0].original_price > product.best_price && (
            <div className="flex items-center justify-end gap-2 mt-0.5">
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.prices[0].original_price)}
              </span>
            </div>
          )}
        </div>

        {/* Price Comparison Mini Cards */}
        <div className="space-y-1.5">
          {sortedPrices.slice(0, 3).map((p, idx) => {
            const platformInfo = getPlatformInfo(p.platform);
            const isLowest = idx === 0;
            const diff = p.price - (cheapestPrice?.price || 0);
            
            return (
              <div
                key={p.platform}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md transition-all ${
                  isLowest
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full ${platformInfo.bgColor} flex items-center justify-center`}>
                    <span className="text-[8px]">{platformInfo.icon}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isLowest ? 'text-green-700' : 'text-gray-600'}`}>
                    {platformInfo.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isLowest ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatPrice(p.price)}
                  </span>
                  {!isLowest && diff > 0 && (
                    <span className="text-[9px] text-red-500 font-medium">
                      +{formatPrice(diff)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
};
