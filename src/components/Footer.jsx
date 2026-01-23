import React, { useState, useEffect } from 'react'; // 'import' küçük harf yapıldı
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
// Vercel hatası için alias yerine relative path kullanıldı
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Footer = () => {
  const { t, language } = useLanguage();
  const [siteSettings, setSiteSettings] = useState({ contact_email: null, site_name: 'GLOBAL' });

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await axios.get(`${API}/site-settings`);
        setSiteSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch site settings');
      }
    };
    fetchSiteSettings();
  }, []);

  return (
    <footer className="bg-[#1A1A1A] text-white mt-16">
      {/* Newsletter / Bülten Alanı */}
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-black">
          <h3 className="text-2xl font-bold font-['Outfit'] mb-2">
            {language === 'tr' ? 'Fırsatları Kaçırmayın' : "Don't Miss the Deals"}
          </h3>
          <p className="font-medium">
            {language === 'tr' ? 'Binlerce ürünü karşılaştırın, en iyi fiyatı bulun.' : 'Compare thousands of products and find the best price.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* 1. Sütun: Logo ve Platformlar */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold font-['Outfit'] tracking-tighter">
              {siteSettings?.site_name || 'GLOBAL'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {language === 'tr' 
                ? 'AliExpress, Temu ve Shein fiyatlarını saniyeler içinde karşılaştırın.' 
                : 'Compare prices from AliExpress, Temu, and Shein in seconds.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#E62E04] text-[10px] px-2 py-1 rounded font-black text-white uppercase tracking-wider">AliExpress</span>
              <span className="bg-[#FB7701] text-[10px] px-2 py-1 rounded font-black text-black uppercase tracking-wider">Temu</span>
              <span className="bg-white text-black text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider">Shein</span>
            </div>
          </div>

          {/* 2. Sütun: Hızlı Linkler */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-['Outfit']">{t('quick_links') || 'Quick Links'}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/products" className="hover:text-[#FB7701] transition-colors">{t('all_products')}</Link></li>
              <li><Link to="/products/electronics" className="hover:text-[#FB7701] transition-colors">Electronics</Link></li>
              <li><Link to="/products/fashion" className="hover:text-[#FB7701] transition-colors">Fashion</Link></li>
              <li><Link to="/products/beauty" className="hover:text-[#FB7701] transition-colors">Beauty</Link></li>
            </ul>
          </div>

          {/* 3. Sütun: Yasal Linkler */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-['Outfit']">{language === 'tr' ? 'Yasal' : 'Legal'}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li>
                <Link to="/privacy" className="hover:text-[#FB7701] transition-colors">
                  {language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#FB7701] transition-colors">
                  {language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FB7701] transition-colors">
                  {language === 'tr' ? 'İletişim' : 'Contact'}
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Sütun: Sosyal Medya */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-['Outfit']">{language === 'tr' ? 'Takip Et' : 'Follow Us'}</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#FB7701] transition-all"><Facebook size={20} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#FB7701] transition-all"><Twitter size={20} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#FB7701] transition-all"><Instagram size={20} /></a>
            </div>

            {/* Contact Email */}
            {siteSettings?.contact_email && (
              <div className="mt-4 flex items-center gap-2 text-gray-400 text-sm">
                <Mail size={16} />
                <a 
                  href={`mailto:${siteSettings.contact_email}`} 
                  className="hover:text-[#FB7701]"
                >
                  {siteSettings.contact_email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer Text (Admin’den gelen) */}
        {siteSettings?.footer_text && (
          <p className="text-gray-400 text-xs mt-8 text-center italic">
            {siteSettings.footer_text}
          </p>
        )}

        {/* Alt Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs font-medium">
            ©️ {new Date().getFullYear()} {siteSettings?.site_name || 'GLOBAL'}. {t('all_rights_reserved') || 'All Rights Reserved.'}
          </p>
          <p className="text-gray-600 text-[10px] italic max-w-md text-center md:text-right uppercase tracking-widest">
            {language === 'tr' 
              ? 'Bağımsız Karşılaştırma Platformu. Satın alımlardan komisyon kazanabiliriz.' 
              : 'Independent Comparison Platform. We may earn commissions from purchases.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
