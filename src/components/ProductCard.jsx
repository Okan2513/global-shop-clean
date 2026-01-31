export const ProductCard = ({ product }) => {

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: 'currency',
      currency: product.currency || 'EUR'
    }).format(price);
  };

  const goToStore = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.affiliate_url) return;

    window.open(product.affiliate_url, "_blank");
  };

  return (
    <div className="border rounded-xl bg-white shadow hover:shadow-lg transition">

      <Link to={`/product/${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-xl"
        />
      </Link>

      <div className="p-3">
        <h3 className="text-sm font-bold mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="text-lg font-black text-[#FB7701] mb-3">
          {formatPrice(product.price)}
        </div>

        <button
          onClick={goToStore}
          className="w-full bg-[#FB7701] text-white py-2 rounded-lg font-bold hover:bg-orange-600"
        >
          Seç
        </button>
      </div>
    </div>
  );
};