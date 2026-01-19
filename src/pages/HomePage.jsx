import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 🔁 Vite uyumlu env adı
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL = RAW_BASE_URL
  ? `${RAW_BASE_URL.replace(/\/$/, '')}/api`
  : null;

console.log("ENV CHECK:", RAW_BASE_URL);

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    if (!API_BASE_URL) {
      console.error('VITE_API_BASE_URL tanımlı değil');
      setError(true);
      setLoading(false);
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
      console.error('API ERROR:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>API bağlantısı yok</div>;

  return (
    <div>
      <h1>Products</h1>
      {products.map(p => (
        <div key={p._id || p.id}>{p.name}</div>
      ))}
    </div>
  );
}
