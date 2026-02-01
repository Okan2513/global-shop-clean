import { useLanguage } from "../contexts/LanguageContext";

export function ProductCard({ product }) {

  const { language } = useLanguage();

  const buttonText = {
    en: "Buy Now",
    tr: "Satın Al",
    fr: "Acheter",
    de: "Kaufen",
    it: "Acquista",
    es: "Comprar",
    nl: "Kopen"
  };

  // API prices array içinden ilk fiyatı al
  const priceData = product.prices?.[0];

  const platform = priceData?.platform || "unknown";
  const price = priceData?.price ?? "-";
  const url = priceData?.affiliate_url || "#";

  const platformColors = {
    aliexpress: "bg-red-500",
    temu: "bg-orange-500",
    shein: "bg-black",
    unknown: "bg-gray-400"
  };

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col">

      {/* IMAGE */}
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover rounded-t-xl"
      />

      {/* CONTENT */}
      <div className="p-3 flex flex-col flex-grow">

        {/* TITLE */}
        <h3 className="text-sm font-semibold line-clamp-2 mb-2">
          {product.name || "No title"}
        </h3>

        {/* PRICE */}
        <div className="text-lg font-bold text-[#FB7701] mb-3">
          {price} €
        </div>

        {/* PLATFORM BADGE */}
        <div className="mb-3">
          <span
            className={`text-white text-xs px-3 py-1 rounded-full ${platformColors[platform]}`}
          >
            {platform.toUpperCase()}
          </span>
        </div>

        {/* BUTTON */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto bg-[#FB7701] hover:bg-[#e66a00] text-white text-sm py-2 rounded-lg text-center font-semibold transition"
        >
          {buttonText[language] || "Buy"}
        </a>

      </div>
    </div>
  );
}
