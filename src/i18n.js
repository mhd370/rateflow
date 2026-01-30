import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // ===== Header =====
      header: {
        subtitle: "Currency Rates",
      },

      // ===== Navigation =====
      nav: {
        home: "Home",
        converter: "Converter",
        market: "Market Trends",
        news: "News",
        crypto: "Crypto",
        gold: "Gold",
      },

      // ===== Auth =====
      auth: {
        login: "Login",
      },

      // ===== News =====
      latestNews: "Latest News",
      seeMore: "See more",

      // ===== Converter =====
      converter: {
        title: "Currency Converter",
        from: "From currency",
        to: "To currency",
        amount: "Add amount",
        convert: "Convert",
        updating: "Updating rates...",
        ready: "Ready to convert",
        loadingError: "Updating currency rates... please wait.",
        selectCurrencies: "Please select currencies and enter an amount.",
        ratesNotReady: "Rates are not ready yet, try again shortly.",
        rateUnavailable: "One of the currency rates is currently unavailable.",
        invalidNumber: "The entered value is not a valid number.",
      },

      // ===== Crypto Card =====
      crypto: {
        title: "Crypto Dashboard",
        live: "Live",
        description:
          "Track top coins, price moves, and market sentiment — all in one place.",
        topCoins: "Top coins",
        marketTrend: "Market trend",
        signals: "Signals",
        open: "Open Crypto Page",
        features: {
          prices: "Live prices & quick change %",
          movers: "Top movers (gainers / losers)",
          converter: "Crypto converter (BTC ↔ USD / EUR)",
          favorites: "Favorites & copy price",
        },
      },

      // ===== Gold & Silver =====
      metals: {
        title: "Today’s Metals Snapshot",
        subtitle:
          "Daily spot reference prices for gold and silver. Tap to open full gold dashboard.",
        gold: "Gold",
        silver: "Silver",
        perOunce: "per ounce",
        open: "Click to open gold & silver page →",
      },

      // ===== Exchange Rates =====
      rates: {
        title: "Live Exchange Rates (vs USD)",
        live: "Live",
        starting: "Live feed starting…",
        update: "Update",
        updating: "Updating...",
        stable: "Stable",
        na: "—",
        notAvailable: "N/A",
        loadError: "Error loading rates.",
        apiError: "API error from server",
        httpError: "HTTP error",
      },
    },
  },

  ar: {
    translation: {
      // ===== Header =====
      header: {
        subtitle: "أسعار العملات",
      },

      // ===== Navigation =====
      nav: {
        home: "الرئيسية",
        converter: "المحوّل",
        market: "اتجاهات السوق",
        news: "الأخبار",
        crypto: "العملات الرقمية",
        gold: "الذهب",
      },

      // ===== Auth =====
      auth: {
        login: "تسجيل الدخول",
      },

      // ===== News =====
      latestNews: "آخر الأخبار",
      seeMore: "المزيد",

      // ===== Converter =====
      converter: {
        title: "محول العملات",
        from: "من العملة",
        to: "إلى العملة",
        amount: "أدخل المبلغ",
        convert: "تحويل",
        updating: "جاري تحديث الأسعار...",
        ready: "جاهز للتحويل",
        loadingError: "جاري تحديث أسعار العملات... لحظة.",
        selectCurrencies: "اختر العملتين وأدخل المبلغ أولاً.",
        ratesNotReady: "الأسعار غير جاهزة بعد، حاول بعد قليل.",
        rateUnavailable: "سعر إحدى العملات غير متوفر حالياً.",
        invalidNumber: "القيمة المدخلة غير صحيحة.",
      },

      // ===== Crypto Card =====
      crypto: {
        title: "لوحة العملات الرقمية",
        live: "مباشر",
        description:
          "تابع أهم العملات، تحركات الأسعار، واتجاهات السوق في مكان واحد.",
        topCoins: "أهم العملات",
        marketTrend: "اتجاه السوق",
        signals: "إشارات",
        open: "فتح صفحة العملات الرقمية",
        features: {
          prices: "أسعار مباشرة ونسبة التغير",
          movers: "أكثر العملات ارتفاعاً وانخفاضاً",
          converter: "محول العملات الرقمية (BTC ↔ USD / EUR)",
          favorites: "المفضلة ونسخ السعر",
        },
      },

      // ===== Gold & Silver =====
      metals: {
        title: "ملخص أسعار المعادن اليوم",
        subtitle:
          "الأسعار الفورية اليومية للذهب والفضة. اضغط لفتح صفحة الذهب الكاملة.",
        gold: "الذهب",
        silver: "الفضة",
        perOunce: "للأونصة",
        open: "اضغط لفتح صفحة الذهب والفضة →",
      },

      // ===== Exchange Rates =====
      rates: {
        title: "أسعار الصرف المباشرة (مقابل الدولار)",
        live: "مباشر",
        starting: "بدء البث المباشر…",
        update: "تحديث",
        updating: "جاري التحديث...",
        stable: "مستقر",
        na: "—",
        notAvailable: "غير متاح",
        loadError: "حدث خطأ أثناء تحميل الأسعار.",
        apiError: "خطأ من السيرفر",
        httpError: "خطأ HTTP",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // اللغة الافتراضية
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
