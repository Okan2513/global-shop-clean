import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 🔁 Vercel uyumlu env adı
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const API_BASE_URL = RAW_BASE_URL
  ? `${RAW_BASE_URL.replace(/\/$/, '')}/api` // sondaki / varsa sil
  : null;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    // 🔴 Backend URL yoksa API çağrısı yapma
    if (!API_BASE_URL) {
      console.error('NEXT_PUBLIC_API_BASE_URL tanımlı değil');
      setProducts([]);
      setLoading(false);
      setError(true);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/products?limit=12`);

      // 🔒 Backend bazen { data: [...] } dönebilir
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setProducts(list);
    } catch (err) {
      console.error('API ERROR:', err);
      setProducts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------- RENDER -------------------- */

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>API bağlantısı yok (Backend adresi eksik)</div>;
  }

  return (
    <div>
      <h1>Products</h1>

      {products.length === 0 && <p>No products found</p>}

      {products.map((p) => (
        <div key={p.id || p._id}>{p.name}</div>
      ))}
    </div>
  );
}
