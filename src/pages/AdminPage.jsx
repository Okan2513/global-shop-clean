import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const { language } = useLanguage();

  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  /* -------------------- FETCH FUNCTIONS -------------------- */

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API}/admin/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await axios.get(`${API}/admin/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  /* -------------------- EFFECTS -------------------- */

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* -------------------- SAVE SETTINGS -------------------- */

  const handleSave = async () => {
    try {
      await axios.post(`${API}/admin/settings`, settings);
      alert(language === 'tr' ? 'Ayarlar kaydedildi' : 'Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(language === 'tr' ? 'Kaydedilemedi' : 'Save failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">
        {language === 'tr' ? 'Yönetim Paneli' : 'Admin Panel'}
      </h1>

      {/* STATS */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'tr' ? 'İstatistikler' : 'Statistics'}
        </h2>

        {loadingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Products" value={stats.products} />
            <StatCard label="Categories" value={stats.categories} />
            <StatCard label="Platforms" value={stats.platforms} />
            <StatCard label="Users" value={stats.users} />
          </div>
        ) : (
          <p className="text-gray-500">
            {language === 'tr'
              ? 'İstatistik bulunamadı.'
              : 'No stats available.'}
          </p>
        )}
      </section>

      {/* SETTINGS */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          {language === 'tr' ? 'Ayarlar' : 'Settings'}
        </h2>

        {loadingSettings ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : settings ? (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <SettingRow
              label="AliExpress API Key"
              value={settings.aliexpress_key}
              onChange={(v) =>
                setSettings((s) => ({ ...s, aliexpress_key: v }))
              }
            />
            <SettingRow
              label="AliExpress Secret"
              value={settings.aliexpress_secret}
              onChange={(v) =>
                setSettings((s) => ({ ...s, aliexpress_secret: v }))
              }
            />

            <Button
              onClick={handleSave}
              className="bg-[#FB7701] hover:bg-[#E66A00] rounded-full px-8"
            >
              {language === 'tr' ? 'Kaydet' : 'Save'}
            </Button>
          </div>
        ) : (
          <p className="text-gray-500">
            {language === 'tr'
              ? 'Ayarlar bulunamadı.'
              : 'No settings found.'}
          </p>
        )}
      </section>
    </div>
  );
}

/* -------------------- HELPERS -------------------- */

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}

function SettingRow({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FB7701]"
      />
    </div>
  );
}
