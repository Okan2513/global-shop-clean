import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;
const LIMIT = 2000;

export default function HomePage() {

  const { language } = useLanguage();
  const platforms = ["aliexpress", "temu", "shein"];

  const [activePlatform, setActivePlatform] = useState("aliexpress");

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

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#FB7701] via-[#FF8C00] to-[#FFD700] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            One Site — Multiple Platforms
          </h1>
        </div>
      </section>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden">

        {/* Platform Tabs */}
        <div className="sticky top-0 z-40 bg-[#FB7701] text-white">
          <div className="flex justify-around py-3 font-bold text-sm">
            {platforms.map(platform => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`px-4 py-2 rounded-full transition ${
                  activePlatform === platform
                    ? "bg-white text-[#FB7701]"
                    : "opacity-80"
                }`}
              >
                {platform.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Active Platform Products */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            {data[activePlatform].map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {loading[activePlatform] && (
            <div className="text-center text-sm text-gray-400 py-4">
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:grid grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-6 h-[75vh]">

        {platforms.map(platform => (
          <div key={platform} className="bg-white rounded-xl shadow flex flex-col">

            <div className="font-bold text-lg p-4 text-[#FB7701]">
              {platform.toUpperCase()}
            </div>

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

    </div>
  );
}
