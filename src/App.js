import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./contexts/LanguageContext";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminPage from "./pages/AdminPage";

// Components
// BURAYI DEĞİŞTİRDİK: Artik "GlobalHeader" dosyasını okuyor
import Header from "./components/GlobalHeader";
import Footer from "./components/Footer";

function App() {
  return (
    <LanguageProvider>
      <div className="App min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <BrowserRouter>
          {/* Buradaki Header artık GlobalHeader dosyanızdan geliyor */}
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:category" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
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
