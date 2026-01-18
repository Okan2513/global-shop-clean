import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL
  ? `${process.env.REACT_APP_BACKEND_URL}/api`
  : null;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    // 🔴 Backend URL yoksa API çağrısı yapma
    if (!API) {
      console.error('REACT_APP_BACKEND_URL tanımlı değil');
      setProducts([]);
      setLoading(false);
      setError(true);
      return;
    }

    try {
      const res = await axios.get(`${API}/products?limit=12`);

      // 🔒 EN KRİTİK GÜVENLİK
      setProducts(Array.isArray(res.data) ? res.data : []);
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
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
