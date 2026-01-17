import { ExternalLink, Check, AlertCircle, TrendingDown, Award, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export const PriceComparison = ({ prices, bestPlatform }) => {
  const { t, language } = useLanguage();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getPlatformInfo = (platform) => {
    switch (platform) {
      case 'aliexpress':
        return { 
          name: 'AliExpress', 
          color: 'bg-red-500', 
          hoverColor: 'hover:bg-red-600',
          lightBg: 'bg-red-50',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          icon: '🛒'
        };
      case 'temu':
        return { 
          name: 'Temu', 
          color: 'bg-orange-500', 
          hoverColor: 'hover:bg-orange-600',
          lightBg: 'bg-orange-50',
          textColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          icon: '🏪'
        };
      case 'shein':
        return { 
          name: 'Shein', 
          color: 'bg-black', 
          hoverColor: 'hover:bg-gray-800',
          lightBg: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: '👗'
        };
      default:
        return { 
          name: platform, 
          color: 'bg-gray-500', 
          hoverColor: 'hover:bg-gray-600',
          lightBg: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          icon: '🏬'
        };
    }
  };

  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0]?.price || 0;
  const highestPrice = sortedPrices[sortedPrices.length - 1]?.price || 0;
  const maxSavings = highestPrice - lowestPrice;

  // Calculate price position for visual bar
  const getPricePosition = (price) => {
    if (highestPrice === lowestPrice) return 0;
    return ((price - lowestPrice) / (highestPrice - lowestPrice)) * 100;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" data-testid="price-comparison-widget">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg font-['Outfit'] flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {t('price_comparison')}
            </h3>
            <p className="text-white/80 text-sm mt-1">
              {language === 'tr' ? 'En uygun fiyatı bul, akıllı alışveriş yap!' : 'Find the best price, shop smart!'}
            </p>
          </div>
          {maxSavings > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-white/80 text-xs">{language === 'tr' ? 'Tasarruf et' : 'Save up to'}</p>
              <p className="text-white font-bold text-lg">{formatPrice(maxSavings)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Summary Bar */}
      <div className="px-5 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">{language === 'tr' ? 'En Ucuz' : 'Cheapest'}</span>
          <span className="text-xs font-medium text-gray-500">{language === 'tr' ? 'En Pahalı' : 'Most Expensive'}</span>
        </div>
        <div className="relative h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
          {sortedPrices.map((price, index) => {
            const position = getPricePosition(price.price);
            const platform = getPlatformInfo(price.platform);
            return (
              <div
                key={price.platform}
                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${platform.color} border-2 border-white shadow-md flex items-center justify-center text-white text-[8px] font-bold transition-all hover:scale-125 cursor-pointer`}
                style={{ left: `calc(${position}% - 10px)` }}
                title={`${platform.name}: ${formatPrice(price.price)}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-green-600">{formatPrice(lowestPrice)}</span>
          <span className="text-sm font-bold text-red-500">{formatPrice(highestPrice)}</span>
        </div>
      </div>

      {/* Price List */}
      <div className="p-4 space-y-3">
        {sortedPrices.map((price, index) => {
          const platform = getPlatformInfo(price.platform);
          const isBest = index === 0; // First in sorted array is cheapest
          const priceDiff = price.price - lowestPrice;
          const savings = price.original_price ? price.original_price - price.price : 0;
          const savingsPercent = price.original_price ? Math.round((savings / price.original_price) * 100) : 0;
          const affiliateUrl = price.affiliate_url || price.url || '#';

          return (
            <div
              key={price.platform}
              className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                isBest 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-lg shadow-green-100' 
                  : `${platform.lightBg} ${platform.borderColor} hover:shadow-md`
              }`}
              data-testid={`price-row-${price.platform}`}
            >
              {/* Best Deal Ribbon */}
              {isBest && (
                <div className="absolute top-0 right-0">
                  <div className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {language === 'tr' ? 'EN UCUZ!' : 'BEST DEAL!'}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Platform Info */}
                  <div className="flex items-center gap-3">
                    {/* Store Badge */}
                    <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-white shadow-md`}>
                      <span className="text-xl">{platform.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-lg ${isBest ? 'text-green-700' : platform.textColor}`}>
                          {platform.name}
                        </span>
                        {isBest && (
                          <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {t('best_price')}
                          </Badge>
                        )}
                        {!isBest && priceDiff > 0 && (
                          <Badge variant="outline" className="text-red-500 border-red-200 text-xs">
                            +{formatPrice(priceDiff)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {!price.in_stock ? (
                          <span className="text-xs text-red-500 flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {t('out_of_stock')}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {language === 'tr' ? 'Stokta' : 'In Stock'}
                          </span>
                        )}
                        {price.in_stock && savingsPercent > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded">
                            -{savingsPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isBest ? 'text-green-600' : 'text-gray-800'}`}>
                        {formatPrice(price.price)}
                      </div>
                      {price.original_price && price.original_price > price.price && (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(price.original_price)}
                          </span>
                          {savings > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {language === 'tr' ? 'Tasarruf' : 'Save'} {formatPrice(savings)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Buy Button */}
                    <a 
                      href={affiliateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <Button
                        className={`buy-button ${price.platform} min-w-[100px] ${!price.in_stock ? 'opacity-50 cursor-not-allowed' : ''} ${isBest ? 'animate-pulse-slow' : ''}`}
                        disabled={!price.in_stock}
                        data-testid={`buy-btn-${price.platform}`}
                      >
                        {isBest ? (language === 'tr' ? 'AL!' : 'BUY!') : t('buy_now')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                {language === 'tr' ? 'Akıllı Karşılaştırma' : 'Smart Comparison'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {language === 'tr' 
                  ? 'Fiyatlar otomatik güncellenir. "Satın Al" butonuna tıklayarak orijinal mağazaya yönlendirilirsiniz.' 
                  : 'Prices update automatically. Click "Buy" to go to the official store.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
