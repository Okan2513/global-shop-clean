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
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FFD700] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold font-['Outfit'] mb-2">{t('dont_miss')}</h3>
          <p className="text-white/90 mb-4">{t('compare_thousands')}</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input type="email" placeholder={language === 'tr' ? 'E-posta' : 'Email'} className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none" />
            <button className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full font-bold">{language === 'tr' ? 'Abone Ol' : 'Subscribe'}</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-3xl font-bold font-['Outfit'] mb-4"><span className="text-[#FB7701]">GLO</span>BAL</h2>
            <p className="text-gray-400">{t('footer_description')}</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('quick_links')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/products">{t('all_products')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('contact')}</h4>
            <p className="text-gray-400">{siteSettings.contact_email || 'info@global.com'}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
