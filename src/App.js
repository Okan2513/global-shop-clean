import React from "react";
// Vercel hatasını önlemek için alias (@) yerine göreceli yollar kullanıyoruz
import "./App.css"; 
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./contexts/LanguageContext";

// Sayfalar (Pages)
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminPage from "./pages/AdminPage";
// Yeni eklediğimiz yasal sayfalar
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// Bileşenler (Components)
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

function App() {
  return (
    <LanguageProvider>
      <div className="App min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <BrowserRouter>
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Ana Rotalar */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:category" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              
              {/* Yasal Rotalar (Yeni Eklenenler) */}
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              
              {/* Admin Paneli */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/*" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </div>
    </LanguageProvider>
  );
}

export default App;
