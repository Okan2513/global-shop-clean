// ... (İmportlar orijinal kodun aynısı)

export default function ProductsPage() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridSize, setGridSize] = useState('normal');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [sortBy, setSortBy] = useState('popular');

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchCategories();
  }, [language]); // Dil değişince kategoriler güncellenir

  useEffect(() => {
    fetchProducts();
  }, [category, searchQuery, priceRange, selectedPlatforms, sortBy, language]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?lang=${language}`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0]);
      if (priceRange[1] < 500) params.append('max_price', priceRange[1]);
      if (selectedPlatforms.length > 0) params.append('platform', selectedPlatforms[0]);
      params.append('sort', sortBy);
      params.append('lang', language);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      
      // HATA KORUMASI:
      const data = response.data?.products || (Array.isArray(response.data) ? response.data : []);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return t('all_products');
    const cat = categories.find(c => c.slug === category);
    if (cat) return cat[`name_${language}`] || cat.name_tr || cat.name;
    return category;
  };

  // Orijinal UI yapısı (Breadcrumb, FilterContent, Grid vs.) aşağıda aynen devam eder...
  // t() fonksiyonu ile tüm başlıklar otomatik dile göre değişir.
