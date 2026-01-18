import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?limit=12&lang=${language}`),
        axios.get(`${API}/categories?lang=${language}`)
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const features = [
    {
      icon: TrendingDown,
      title: language === 'tr' ? 'En Ucuz Fiyat' : 'Best Prices',
      description: language === 'tr' ? '3 platformu karşılaştır' : 'Compare 3 platforms'
    },
    {
      icon: Zap,
      title: language === 'tr' ? 'Otomatik Güncelleme' : 'Auto Updates',
      description: language === 'tr' ? 'Fiyatlar anlık güncellenir' : 'Real-time sync'
    },
    {
      icon: Shield,
      title: language === 'tr' ? 'Güvenli Alışveriş' : 'Safe Shopping',
      description: language === 'tr' ? 'Orijinal mağazalara yönlendirim' : 'Direct to stores'
    }
  ];

  const getBentoClass = (index) => {
    const classes = ['col-span-2 row-span-2', '', '', 'row-span-2', '', 'col-span-2'];
    return classes[index % classes.length];
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* HERO */}
