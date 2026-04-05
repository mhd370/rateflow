import "./App.css";

import Head from "./Head";
import Footer from "./Footer";

// الصفحات
import HomePage from "./ForHomePage/HomePage";

import CryptoPage from "./CryptoPage";
import NewsPage from "./ForNewsPage/NewsPage";
import GoldPage from "./ForGoldSilverPage/GoldPage";
import Converter from "./ForConverter/Converter";
import MarketTrend from "./For Market Trends/MarketTrends";
import AIMarketPage from "./pages/AIMarketPage";
import AccountPage from "./pages/auth/AccountPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { AuthProvider } from "./pages/auth/AuthContext";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function ConverterPage() {
  return (
    <div style={{ minHeight: "80vh" }}>
      <Converter />
    </div>
  );
}

// صفحة الـ Market Trends المستقلة
function MarketTrendsPage() {
  return (
    <div style={{ minHeight: "80vh", marginTop: "200px" }}>
      <MarketTrend />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Head />

        {/* المحتوى */}
        <main
          style={{
            minHeight: "80vh",
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/converter" element={<ConverterPage />} />
            <Route path="/market-trends" element={<MarketTrendsPage />} />
              <Route
                path="/ai-insights"
                element={
                  <ProtectedRoute>
                    <AIMarketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/crypto" element={<CryptoPage />} />
            <Route path="/gold" element={<GoldPage />} />
          </Routes>
        </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
