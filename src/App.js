import React from "react";
import "./App.css"; 
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./contexts/LanguageContext";

// Sayfalar
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminPage from "./pages/AdminPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// Bileşenler
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// 🔥 ANDROID BEYAZ EKRAN SİGORTASI
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("APP ERROR:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div>Bir hata oluştu. Lütfen sayfayı yenileyin.</div>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      {/* 🔥 Router EN DIŞTA ve basename EKLİ (Vercel + Admin fix) */}
      <BrowserRouter basename="/">
        <LanguageProvider>
          <div className="App min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            
            <Header />

            <main className="flex-1">
              <Routes>
                {/* Ana Rotalar */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:category" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />

                {/* Yasal Sayfalar */}
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                {/* Admin Paneli (TEK VE DOĞRU HALİ) */}
                <Route path="/admin/*" element={<AdminPage />} />
              </Routes>
            </main>

            <Footer />

            <Toaster richColors position="top-right" />
          </div>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
