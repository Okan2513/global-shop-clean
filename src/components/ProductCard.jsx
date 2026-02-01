import { useLanguage } from "../contexts/LanguageContext";

export function ProductCard({ product }) {
  const { language } = useLanguage();

  if (!product) return null;

  // BACKEND MAPPING (KRİTİK)
  const title =
    product.title ||
    product.name ||
    "No title";

  const price =
    product.price ||
    product.price_value ||
    product.priceValue ||
    null;

  const platform =
    (product.platform ||
      product.source ||
      product.marketplace ||
      "").toLowerCase();

  const url =
    product.url ||
    product.link ||
    "#";

  const image =
    product.image ||
    product.image_url ||
    product.img ||
    "/placeholder.jpg";

  const buttonText = {
    en: "Buy Now",
    tr: "Satın Al",
    fr: "Acheter",
    de: "Kaufen",
    it: "Acquista",
    es: "Comprar",
    nl: "Kopen"
  };

  const platformColors = {
    aliexpress: "bg-red-500",
    temu: "bg-orange-500",
    shein: "bg-black"
  };

  const badgeColor = platformColors[platform] || "bg-gray-500";

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col">

      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover rounded-t-xl"
      />

      <div className="p-3 flex flex-col flex-grow">

        <h3 className="text-sm font-semibold line-clamp-2 mb-2">
          {title}
        </h3>

        <div className="text-lg font-bold text-[#FB7701] mb-3">
          {price ? `${price} €` : "—"}
        </div>

        <div className="mb-3">
          <span
            className={`text-white text-xs px-3 py-1 rounded-full ${badgeColor}`}
          >
            {platform ? platform.toUpperCase() : "UNKNOWN"}
          </span>
        </div>

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
