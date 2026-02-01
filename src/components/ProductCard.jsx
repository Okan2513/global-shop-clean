export const ProductCard = ({ product }) => {

  const firstPrice = product.prices?.[0];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: 'currency',
      currency: 'EUR'
    }).format(price ?? 0);
  };

  const goToStore = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!firstPrice?.affiliate_url) return;

    window.open(firstPrice.affiliate_url, "_blank");
  };

  return (
    <div className="border rounded-xl bg-white shadow hover:shadow-lg transition">

      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover rounded-t-xl"
      />

      <div className="p-3">
        <h3 className="text-sm font-bold mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="text-lg font-black text-[#FB7701] mb-3">
          {formatPrice(firstPrice?.price)}
        </div>

        <button
          onClick={goToStore}
          className="w-full bg-[#FB7701] text-white py-2 rounded-lg font-bold hover:bg-orange-600"
        >
          Choisir
        </button>
      </div>
    </div>
  );
};
