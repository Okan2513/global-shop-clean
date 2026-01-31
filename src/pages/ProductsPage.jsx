import { useEffect, useState } from "react";
import axios from "axios";
import { ProductCard } from "../components/ProductCard";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;

const LIMIT = 20;

export default function ProductsPage() {
  const platforms = ["aliexpress", "temu", "shein"];

  const [activePlatform, setActivePlatform] = useState("aliexpress");
  const [products, setProducts] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resetAndLoad();
  }, [activePlatform]);

  const resetAndLoad = () => {
    setProducts([]);
    setSkip(0);
    loadProducts(0);
  };

  const loadProducts = async (customSkip = skip) => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `${API}/products?platform=${activePlatform}&limit=${LIMIT}&skip=${customSkip}`
      );

      setProducts(prev => [...prev, ...res.data]);
      setSkip(prev => prev + LIMIT);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadProducts();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* HEADER TITLE */}
      <div className="text-center py-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          One Site — Multiple Platforms
        </h1>
      </div>

      {/* PLATFORM TABS */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex justify-center gap-4">

          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-6 py-3 rounded-full font-bold transition 
              ${
                activePlatform === platform
                  ? "bg-[#FB7701] text-white"
                  : "bg-white text-gray-600 hover:bg-orange-100"
              }`}
            >
              {platform.toUpperCase()}
            </button>
          ))}

        </div>
      </div>

      {/* PRODUCTS AREA */}
      <div
        onScroll={handleScroll}
        className="max-w-7xl mx-auto px-4 overflow-y-auto h-[75vh]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10">
          {products.map((product) => (
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
