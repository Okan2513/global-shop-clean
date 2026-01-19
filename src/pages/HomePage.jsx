import { useState, useEffect, useCallback } from "react";
import axios from "axios";




const RAW_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const API_BASE_URL = RAW_BASE_URL
  ? `${RAW_BASE_URL.replace(/\/$/, "")}/api`
  : null;

console.log("ENV CHECK:", RAW_BASE_URL);

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_BASE_URL) {
      console.error("REACT_APP_API_BASE_URL tanımlı değil");
      setError(true);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/products?limit=12`);

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setProducts(list);
    } catch (err) {
      console.error("API ERROR:", err);
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Popüler Ürünler</h2>

        {error && (
          <div className="text-red-500 mb-4">
            API bağlantısı yok (Backend adresi eksik)
          </div>
        )}

        
      </div>
    </>
  );
}