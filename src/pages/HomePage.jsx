import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;
const LIMIT = 500;

export default function HomePage() {

  const { language } = useLanguage();
  const platforms = ["aliexpress", "temu", "shein"];

  const [data, setData] = useState({
    aliexpress: [],
    temu: [],
    shein: [],
  });

  const [skip, setSkip] = useState({
    aliexpress: 0,
    temu: 0,
    shein: 0,
  });

  const [loading, setLoading] = useState({
    aliexpress: false,
    temu: false,
    shein: false,
  });

  const containers = {
    aliexpress: useRef(null),
    temu: useRef(null),
    shein: useRef(null),
  };

  useEffect(() => {
    platforms.forEach(p => loadProducts(p));
  }, []);

  const loadProducts = async (platform) => {
    if (loading[platform]) return;

    setLoading(prev => ({ ...prev, [platform]: true }));

    try {
      const res = await axios.get(
        `${API}/products?platform=${platform}&limit=${LIMIT}&skip=${skip[platform]}`
      );

      setData(prev => ({
        ...prev,
        [platform]: [...prev[platform], ...res.data],
      }));

      setSkip(prev => ({
        ...prev,
        [platform]: prev[platform] + LIMIT,
      }));
    } catch (err) {
      console.error(platform, err);
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleScroll = (platform) => {
    const container = containers[platform].current;
    if (!container) return;

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      loadProducts(platform);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* HERO — Küçültülmüş */}
      <section className="bg-gradient-to-br from-[#FB7701] via-[#FF8C00] to-[#FFD700] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            One Site — Multiple Platforms
          </h1>
        </div>
      </section>


      {/* PLATFORM HEADER BAR */}
      <div className="bg-[#FB7701] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-3 text-center font-bold py-3">
          <div>ALIEXPRESS</div>
          <div>TEMU</div>
          <div>SHEIN</div>
        </div>
      </div>


      {/* DESKTOP 3 KOLON */}
      <div className="hidden md:grid grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-6 h-[75vh]">

        {platforms.map(platform => (
          <div key={platform} className="bg-white rounded-xl shadow flex flex-col">

            <div
              ref={containers[platform]}
              onScroll={() => handleScroll(platform)}
              className="overflow-y-auto p-4 space-y-4"
            >
              {data[platform].map(product => (
                <ProductCard key={product.id} product={product} />
              ))}

              {loading[platform] && (
                <div className="text-center text-sm text-gray-400 py-4">
                  Loading...
                </div>
              )}
            </div>

          </div>
        ))}

      </div>


      {/* MOBILE — Horizontal Platform Switch */}
      <div className="md:hidden px-4 py-6 space-y-6">

        {platforms.map(platform => (
          <div key={platform}>
            <h2 className="font-bold text-lg mb-3 text-[#FB7701]">
              {platform.toUpperCase()}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {data[platform].slice(0, 10).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
