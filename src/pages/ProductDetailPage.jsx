import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://global-shop-clean.onrender.com"}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const mainPrice = product.prices?.[0];

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6 md:p-10">

        {/* PLATFORM */}
        <div className="mb-6">
          <span className="bg-[#FB7701] text-white px-4 py-2 rounded-full text-sm font-bold uppercase">
            {mainPrice?.platform}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* IMAGE */}
          <div className="flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-xl max-h-[400px] object-contain"
            />
          </div>

          {/* INFO */}
          <div className="flex flex-col justify-between">

            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-[#FB7701] mb-6">
                €{mainPrice?.price}
              </p>

              {product.description && (
                <p className="text-gray-600 mb-6">
                  {product.description}
                </p>
              )}
            </div>

            {/* SELECT BUTTON */}
            <a
              href={mainPrice?.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#FB7701] hover:bg-[#E66A00] text-white font-bold py-4 rounded-xl transition"
            >
              Seç
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}
