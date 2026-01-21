import React from 'react';
// @ yerine göreceli yol kullanarak Vercel hatasını çözüyoruz
import { useLanguage } from '../contexts/LanguageContext';

export default function TermsPage() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 min-h-screen text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-8 font-['Outfit'] border-b pb-4 text-[#1A1A1A]">
        {language === 'tr' ? 'Kullanım Koşulları ve Yasal Uyarı' : 'Terms of Service & Legal Disclaimer'}
      </h1>
      
      <div className="space-y-8 text-sm md:text-base">
        {/* 1. Hizmet Tanımı: Satıcı olmadığınızı netleştirir */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Outfit'] uppercase tracking-tight">1. Service Description</h2>
          <p>
            GLOBAL operates exclusively as an independent price comparison and information engine. We are <strong>not a merchant, seller, or retailer</strong>. 
            We do not hold inventory or sell products directly. Our platform facilitates price comparison across third-party merchants 
            including AliExpress, Temu, and Shein. All final transactions are conducted on the merchant's platform.
          </p>
        </section>

        {/* 2. Komisyon ve Hak Koruma: Platformlara karşı "benim sayemde kazandın" belgesi */}
        <section className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <h2 className="text-xl font-bold text-[#FB7701] mb-3 font-['Outfit'] uppercase tracking-tight">2. Affiliate Disclosure & Referral Rights</h2>
          <p>
            In accordance with European Union consumer transparency directives, GLOBAL discloses that it operates as an affiliate platform. 
            When users are redirected to partner platforms (AliExpress, Temu, Shein) and complete a purchase, GLOBAL is entitled to a 
            referral commission. By using this service, merchants and users acknowledge that GLOBAL's redirection constitutes a valid commercial referral.
          </p>
        </section>

        {/* 3. Avrupa Birliği Vergi ve Sorumluluk Sınırı: Seni cezalardan korur */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Outfit'] uppercase tracking-tight">3. EU Customs, VAT and Liability Disclaimer</h2>
          <p>
            For transactions involving shipping to the European Union: GLOBAL is not responsible for the calculation, collection, or payment of 
            VAT (Value Added Tax), Import Duties, or Customs Fees. These obligations remain strictly between the consumer and the third-party merchant.
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
            <li>GLOBAL does not warrant that price information is always identical to the merchant site due to API synchronization latency.</li>
            <li>We are not liable for product quality, late deliveries, or merchant-side disputes.</li>
          </ul>
        </section>

        {/* 4. Tüm Hakları Saklıdır: İçerik hırsızlığına karşı koruma */}
        <section className="pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">
            © {new Date().getFullYear()} GLOBAL. ALL RIGHTS RESERVED. Unauthorized automated scraping or commercial reproduction 
            of our comparison algorithms and data is strictly prohibited under EU Intellectual Property laws.
          </p>
        </section>
      </div>
    </div>
  );
}
