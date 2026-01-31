import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;

const LIMIT = 20;

export default function ProductsPage() {
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
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-6">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-2xl font-bold text-center mb-6">
          One Site — Multiple Platforms
        </h1>

        {/* DESKTOP */}
        <div className="hidden md:grid grid-cols-3 gap-6 h-[80vh]">

          {platforms.map(platform => (
            <div key={platform} className="flex flex-col bg-white rounded-xl shadow">

              <div className="p-4 font-bold text-center border-b">
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

        {/* MOBILE */}
        <div className="md:hidden space-y-6">
          {platforms.map(platform => (
            <div key={platform}>
              <h2 className="font-bold text-lg mb-3">
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
    </div>
  );
}
