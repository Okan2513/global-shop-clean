import { useEffect, useState } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;
const LIMIT = 500;

export default function ProductsPage() {
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts(activePlatform);
  }, [activePlatform]);

  const loadProducts = async (platform) => {
    if (loading) return;

    setLoading(true);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* 🔥 PLATFORM TABS */}
      <div className="sticky top-[120px] bg-[#FB7701] text-white z-40 shadow-md">
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

      {/* 🔥 ACTIVE PLATFORM PRODUCTS */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data[activePlatform].map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {loading && (
          <div className="text-center py-6 text-gray-400">
            Loading...
          </div>
        )}

      </div>
    </div>
  );
}
