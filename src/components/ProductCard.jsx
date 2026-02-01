import { useLanguage } from "../contexts/LanguageContext";

export function ProductCard({ product }) {
  const { language } = useLanguage();

  /* BUY BUTTON TEXT */
  const buttonText = {
    en: "Buy Now",
    tr: "Satın Al",
    fr: "Acheter",
    de: "Kaufen",
    it: "Acquista",
    es: "Comprar",
    nl: "Kopen"
  };

  /* PLATFORM COLORS */
  const platformColors = {
    aliexpress: "bg-red-500",
    temu: "bg-orange-500",
    shein: "bg-black"
  };

  /* SAFE PLATFORM (CRASH ENGELLEME) */
  const safePlatform =
    product?.platform && platformColors[product.platform]
      ? product.platform
      : "aliexpress";

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col">

      {/* IMAGE */}
      <img
        src={product?.image || "/placeholder.jpg"}
        alt={product?.title || "product"}
        className="w-full h-48 object-cover rounded-t-xl"
      />

      {/* CONTENT */}
      <div className="p-3 flex flex-col flex-grow">

        {/* TITLE */}
        <h3 className="text-sm font-semibold line-clamp-2 mb-2">
          {product?.title || "Product"}
        </h3>

        {/* PRICE */}
        <div className="text-lg font-bold text-[#FB7701] mb-3">
          {product?.price ? `${product.price} €` : ""}
        </div>

        {/* PLATFORM BADGE */}
        <div className="mb-3">
          <span
            className={`text-white text-xs px-3 py-1 rounded-full ${platformColors[safePlatform]}`}
          >
            {safePlatform.toUpperCase()}
          </span>
        </div>

        {/* BUTTON */}
        <a
          href={product?.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto bg-[#FB7701] hover:bg-[#e66a00] text-white text-sm py-2 rounded-lg text-center font-semibold transition"
        >
          {buttonText[language] || "Buy Now"}
        </a>

      </div>
    </div>
  );
}
