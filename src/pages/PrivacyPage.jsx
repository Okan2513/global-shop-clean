import React from 'react';
// Vercel hatasını önlemek için relative path kullanıyoruz
import { useLanguage } from '../contexts/LanguageContext';

export default function PrivacyPage() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 min-h-screen text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-8 font-['Outfit'] border-b pb-4 text-[#1A1A1A]">
        {language === 'tr' ? 'Gizlilik Politikası (GDPR)' : 'Privacy Policy (GDPR)'}
      </h1>
      
      <div className="space-y-8 text-sm md:text-base">
        {/* 1. Veri Sorumlusu */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Outfit']">1. Data Controller</h2>
          <p>
            In accordance with the <strong>General Data Protection Regulation (EU GDPR)</strong>, GLOBAL operates as a privacy-first affiliate engine. 
            We do not require user registration and we do not collect personal identification information such as names, physical addresses, or phone numbers.
          </p>
        </section>

        {/* 2. Çerezler ve Takip: Avrupa'daki çerez yasası için kritik */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Outfit']">2. Cookies and Tracking Technologies</h2>
          <p>
            We use technical cookies to optimize your comparison experience. When you click on an affiliate link to AliExpress, Temu, or Shein, 
            a tracking cookie from the respective merchant may be placed on your device to ensure GLOBAL receives credit for the referral. 
            These cookies are managed by the partner platforms under their own privacy policies.
          </p>
        </section>

        {/* 3. Veri Güvenliği ve Transferi */}
        <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-900">
          <h2 className="text-xl font-bold mb-3 font-['Outfit']">3. International Data Transfers</h2>
          <p>
            Since our partner platforms (AliExpress, Temu, Shein) operate globally, clicking on product links may involve 
            the transfer of anonymous technical data outside the European Economic Area (EEA). By using our comparison service, 
            you acknowledge these third-party redirects.
          </p>
        </section>

        {/* 4. Kullanıcı Hakları */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Outfit']">4. Your Rights under GDPR</h2>
          <p>
            As an EU resident, you have the right to access, rectify, or delete any data we might possess. 
            Because we do not store personal profiles, you can exercise these rights primarily by clearing your 
            browser cookies or managing your tracking preferences in your browser settings.
          </p>
        </section>

        <footer className="pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">
            Last Updated: January 2026. This policy is designed to protect both the consumer and GLOBAL under EU law.
          </p>
        </footer>
      </div>
    </div>
  );
}
