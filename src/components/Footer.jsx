import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
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
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold font-['Outfit'] mb-2">
            {t('dont_miss')}
          </h3>
          <p className="text-white/90 mb-4">
            {t('compare_thousands')}
          </p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder={language === 'tr' ? 'E-posta adresiniz' : 'Your email address'}
              className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              data-testid="newsletter-email"
            />
            <button className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors" data-testid="newsletter-submit">
              {language === 'tr' ? 'Abone Ol' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-bold font-['Outfit'] mb-4">
              <span className="text-[#FB7701]">GLO</span>
              <span>BAL</span>
            </h2>
            <p className="text-gray-400 mb-4">
              {t('footer_description')}
            </p>
            <div className="flex gap-3 mt-6">
              <span className="platform-badge platform-aliexpress text-xs">AliExpress</span>
              <span className="platform-badge platform-temu text-xs">Temu</span>
              <span className="platform-badge platform-shein text-xs">Shein</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-['Outfit']">{t('quick_links')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  {t('all_products')}
                </Link>
              </li>
              <li>
                <Link to="/products/electronics" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products/fashion" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/products/beauty" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  Beauty
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-['Outfit']">{t('quick_links')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  {t('privacy_policy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  {t('terms_of_service')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors">
                  {t('contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-['Outfit']">{t('contact')}</h4>
            {siteSettings.contact_email ? (
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="h-5 w-5 text-[#FB7701]" />
                  {siteSettings.contact_email}
                </li>
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                {language === 'tr' ? 'İletişim bilgileri yakında eklenecek' : 'Contact info coming soon'}
              </p>
            )}
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#FB7701] transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {siteSettings.site_name || 'GLOBAL'}. {t('all_rights_reserved')}
          </p>
          <p className="text-gray-600 text-xs">
            {language === 'tr' ? 'Affiliate karşılaştırma platformu. Satışlardan komisyon alabiliriz.' : 'Affiliate comparison platform. We may earn commissions from purchases.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
