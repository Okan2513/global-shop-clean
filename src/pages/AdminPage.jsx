import { useState, useEffect, useRef } from 'react';
import { Upload, Settings, RefreshCw, Database, FileText, AlertCircle, CheckCircle, Clock, Lock, Mail, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { t } = useLanguage();

  // Check authentication on load
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth) {
      setIsAuthenticated(true);
      fetchStats(savedAuth);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    
    const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
    
    try {
      await axios.get(`${API}/admin/auth-check`, {
        headers: { 'Authorization': authHeader }
      });
      
      sessionStorage.setItem('adminAuth', authHeader);
      setIsAuthenticated(true);
      fetchStats(authHeader);
      toast.success('Login successful');
    } catch (error) {
      setAuthError('Invalid credentials');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
  };

  const getAuthHeader = () => {
    return sessionStorage.getItem('adminAuth');
  };

  const fetchStats = async (auth) => {
    try {
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { 'Authorization': auth || getAuthHeader() }
      });
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" data-testid="admin-login">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#FB7701] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter username"
                  required
                  data-testid="admin-username"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  data-testid="admin-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#FB7701] hover:bg-[#E66A00]"
                disabled={loading}
                data-testid="admin-login-btn"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'import', label: 'Feed Import', icon: Upload },
    { id: 'settings', label: 'API Settings', icon: Settings },
    { id: 'site', label: 'Site Settings', icon: Globe },
    { id: 'history', label: 'Sync History', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <Button variant="outline" onClick={handleLogout} data-testid="admin-logout">
            Logout
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`admin-nav w-full ${activeTab === tab.id ? 'active' : ''}`}
                  data-testid={`admin-tab-${tab.id}`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            {activeTab === 'dashboard' && <DashboardTab stats={stats} loading={loading} />}
            {activeTab === 'import' && <ImportTab onSuccess={() => fetchStats()} getAuthHeader={getAuthHeader} />}
            {activeTab === 'settings' && <SettingsTab getAuthHeader={getAuthHeader} />}
            {activeTab === 'site' && <SiteSettingsTab getAuthHeader={getAuthHeader} />}
            {activeTab === 'history' && <HistoryTab stats={stats} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ stats, loading }) {
  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.total_products?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {stats?.products_by_platform && Object.entries(stats.products_by_platform).map(([platform, count]) => (
          <Card key={platform}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 capitalize">{platform}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {count?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_imports?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_imports.map((imp) => (
                <div key={imp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{imp.platform}</p>
                      <p className="text-sm text-slate-500">{imp.filename}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={imp.status} />
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(imp.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No imports yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ImportTab({ onSuccess, getAuthHeader }) {
  const [platform, setPlatform] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xml'))) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a CSV or XML file');
    }
  };

  const handleUpload = async () => {
    if (!platform || !file) {
      toast.error('Please select a platform and upload a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/admin/feeds/import?platform=${platform}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': getAuthHeader()
        }
      });
      
      toast.success('Import successful', {
        description: `${response.data.products_imported} imported, ${response.data.products_updated} updated`
      });
      
      setFile(null);
      setPlatform('');
      onSuccess();
    } catch (error) {
      toast.error('Import failed', {
        description: error.response?.data?.detail || 'An error occurred'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Feed</CardTitle>
        <CardDescription>
          Import product feeds from affiliate networks (CSV/XML format)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger data-testid="platform-select">
              <SelectValue placeholder="Select platform..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aliexpress">AliExpress</SelectItem>
              <SelectItem value="temu">Temu</SelectItem>
              <SelectItem value="shein">Shein</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Upload File</Label>
          <div
            className={`upload-zone ${dragOver ? 'border-[#FB7701] bg-orange-50' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xml"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <Upload className="h-10 w-10 mx-auto mb-4 text-slate-400" />
            {file ? (
              <p className="font-medium text-slate-800">{file.name}</p>
            ) : (
              <>
                <p className="font-medium text-slate-800">Drop your file here or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">CSV or XML files supported</p>
              </>
            )}
          </div>
        </div>

        <Button
          className="w-full bg-[#FB7701] hover:bg-[#E66A00]"
          onClick={handleUpload}
          disabled={!platform || !file || uploading}
          data-testid="import-btn"
        >
          {uploading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Feed
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsTab({ getAuthHeader }) {
  const [settings, setSettings] = useState({
    aliexpress_app_key: '',
    aliexpress_app_secret: '',
    aliexpress_tracking_id: '',
    temu_affiliate_id: '',
    temu_api_key: '',
    shein_affiliate_id: '',
    shein_api_key: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/admin/settings`, settings, {
        headers: { 'Authorization': getAuthHeader() }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AliExpress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">A</span>
            AliExpress API
          </CardTitle>
          <CardDescription>Configure AliExpress Affiliate API for automatic product sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>App Key</Label>
              <Input
                value={settings.aliexpress_app_key}
                onChange={(e) => setSettings({ ...settings, aliexpress_app_key: e.target.value })}
                placeholder="Enter App Key"
              />
            </div>
            <div className="space-y-2">
              <Label>App Secret</Label>
              <Input
                type="password"
                value={settings.aliexpress_app_secret}
                onChange={(e) => setSettings({ ...settings, aliexpress_app_secret: e.target.value })}
                placeholder="Enter App Secret"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tracking ID</Label>
            <Input
              value={settings.aliexpress_tracking_id}
              onChange={(e) => setSettings({ ...settings, aliexpress_tracking_id: e.target.value })}
              placeholder="Enter Affiliate Tracking ID"
            />
          </div>
        </CardContent>
      </Card>

      {/* Temu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">T</span>
            Temu Affiliate
          </CardTitle>
          <CardDescription>Configure Temu affiliate settings (manual links supported)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Affiliate ID</Label>
              <Input
                value={settings.temu_affiliate_id}
                onChange={(e) => setSettings({ ...settings, temu_affiliate_id: e.target.value })}
                placeholder="Enter Temu Affiliate ID"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (optional)</Label>
              <Input
                type="password"
                value={settings.temu_api_key}
                onChange={(e) => setSettings({ ...settings, temu_api_key: e.target.value })}
                placeholder="Enter API Key if available"
              />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-700">
            <p>Temu operates in semi-automatic mode. Import products via CSV/XML with your affiliate links.</p>
          </div>
        </CardContent>
      </Card>

      {/* Shein */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-sm font-bold">S</span>
            Shein Affiliate
          </CardTitle>
          <CardDescription>Configure Shein affiliate settings (manual links supported)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Affiliate ID</Label>
              <Input
                value={settings.shein_affiliate_id}
                onChange={(e) => setSettings({ ...settings, shein_affiliate_id: e.target.value })}
                placeholder="Enter Shein Affiliate ID"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (optional)</Label>
              <Input
                type="password"
                value={settings.shein_api_key}
                onChange={(e) => setSettings({ ...settings, shein_api_key: e.target.value })}
                placeholder="Enter API Key if available"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <p>Shein operates in semi-automatic mode. Import products via CSV/XML with your affiliate links.</p>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-slate-900 text-white"
        onClick={handleSave}
        disabled={saving}
        data-testid="save-settings-btn"
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
}

function SiteSettingsTab({ getAuthHeader }) {
  const [settings, setSettings] = useState({
    contact_email: '',
    site_name: 'GLOBAL',
    footer_text: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/site-settings`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/admin/site-settings`, settings, {
        headers: { 'Authorization': getAuthHeader() }
      });
      toast.success('Site settings saved successfully');
    } catch (error) {
      toast.error('Failed to save site settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Site Settings
        </CardTitle>
        <CardDescription>Configure public site information displayed in the footer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Site Name</Label>
          <Input
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            placeholder="GLOBAL"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Email
          </Label>
          <Input
            type="email"
            value={settings.contact_email || ''}
            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            placeholder="contact@yoursite.com"
          />
          <p className="text-xs text-slate-500">Leave empty to hide contact email in footer</p>
        </div>

        <div className="space-y-2">
          <Label>Footer Text (optional)</Label>
          <Input
            value={settings.footer_text || ''}
            onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
            placeholder="Custom footer message"
          />
        </div>

        <Button
          className="w-full bg-[#FB7701] hover:bg-[#E66A00]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Site Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

function HistoryTab({ stats }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_imports?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_imports.map((imp) => (
                <div key={imp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{imp.filename}</p>
                      <p className="text-sm text-slate-500 capitalize">{imp.platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={imp.status} />
                    <p className="text-sm text-slate-500 mt-1">
                      {imp.products_imported || 0} imported, {imp.products_updated || 0} updated
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No import history</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_syncs?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_syncs.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{sync.platform}</p>
                      <p className="text-sm text-slate-500">{sync.sync_type} sync</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={sync.status} />
                    <p className="text-sm text-slate-500 mt-1">{sync.products_synced || 0} products</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No sync history</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    processing: { icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
    completed: { icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    running: { icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
    failed: { icon: AlertCircle, className: 'bg-red-100 text-red-800' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} text-xs`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}
