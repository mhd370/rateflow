// Global asset catalog: single source of truth for instruments (chart/chat)
// and converter units (fiat/crypto/metals).

export const ASSET_CATEGORIES = {
  CRYPTO: "crypto",
  FOREX: "forex",
  METALS: "metals",
};

export const CHART_PROVIDERS = {
  COINGECKO: "coingecko",
  CURRENCYAPI: "currencyapi",
  NONE: "none",
};

export const CONVERTER_UNIT_TYPES = {
  FIAT: "Fiat",
  CRYPTO: "Crypto",
  METAL: "Metal",
};

export const FIAT_META = {
  USD: { label: "US Dollar", flag: "us" },
  EUR: { label: "Euro", flag: "eu" },
  GBP: { label: "British Pound", flag: "gb" },
  JPY: { label: "Japanese Yen", flag: "jp" },
  CHF: { label: "Swiss Franc", flag: "ch" },
  AUD: { label: "Australian Dollar", flag: "au" },
  CAD: { label: "Canadian Dollar", flag: "ca" },
  TRY: { label: "Turkish Lira", flag: "tr" },
  SYP: { label: "Syrian Pound", flag: "sy" },
  AED: { label: "UAE Dirham", flag: "ae" },
  SAR: { label: "Saudi Riyal", flag: "sa" },
  EGP: { label: "Egyptian Pound", flag: "eg" },
  NZD: { label: "New Zealand Dollar", flag: "nz" },
  CNY: { label: "Chinese Yuan", flag: "cn" },
};

export const CRYPTO_META = {
  BTC: { label: "Bitcoin", coingeckoId: "bitcoin", brandColor: "#f7931a" },
  ETH: { label: "Ethereum", coingeckoId: "ethereum", brandColor: "#627eea" },
  SOL: { label: "Solana", coingeckoId: "solana", brandColor: "#14f195" },
  BNB: { label: "BNB", coingeckoId: "binancecoin", brandColor: "#f3ba2f" },
  XRP: { label: "XRP", coingeckoId: "ripple", brandColor: "#22a2bd" },
  ADA: { label: "Cardano", coingeckoId: "cardano", brandColor: "#2a71d0" },
  DOGE: { label: "Dogecoin", coingeckoId: "dogecoin", brandColor: "#c2a633" },
  AVAX: { label: "Avalanche", coingeckoId: "avalanche-2", brandColor: "#e84142" },
  MATIC: { label: "Polygon", coingeckoId: "matic-network", brandColor: "#8247e5" },
  DOT: { label: "Polkadot", coingeckoId: "polkadot", brandColor: "#e6007a" },
  // Common extras already used in the app converter.
  USDT: { label: "Tether", coingeckoId: "tether", brandColor: "#26a17b" },
  BUSD: { label: "Binance USD", coingeckoId: "binance-usd", brandColor: "#f3ba2f" },
};

export const METAL_META = {
  XAU: { label: "Gold", short: "Au" },
  XAG: { label: "Silver", short: "Ag" },
};

// Instruments used by AI Insights (chart + chat context). Converter uses UNIT_CATALOG below.
export const INSTRUMENT_CATALOG = [
  // Crypto (chart-supported via CoinGecko OHLC/derived)
  {
    id: "btc-usd",
    symbol: "BTC/USD",
    label: "Bitcoin",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "BTC", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "BTC" },
    aiDisplayName: "Bitcoin (BTC/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.BTC.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "BTC" },
  },
  {
    id: "eth-usd",
    symbol: "ETH/USD",
    label: "Ethereum",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "ETH", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "ETH" },
    aiDisplayName: "Ethereum (ETH/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.ETH.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "ETH" },
  },
  {
    id: "sol-usd",
    symbol: "SOL/USD",
    label: "Solana",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "SOL", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "SOL" },
    aiDisplayName: "Solana (SOL/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.SOL.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "SOL" },
  },
  {
    id: "bnb-usd",
    symbol: "BNB/USD",
    label: "BNB",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "BNB", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "BNB" },
    aiDisplayName: "BNB (BNB/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.BNB.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "BNB" },
  },
  {
    id: "xrp-usd",
    symbol: "XRP/USD",
    label: "XRP",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "XRP", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "XRP" },
    aiDisplayName: "XRP (XRP/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.XRP.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "XRP" },
  },
  {
    id: "ada-usd",
    symbol: "ADA/USD",
    label: "Cardano",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "ADA", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "ADA" },
    aiDisplayName: "Cardano (ADA/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.ADA.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "ADA" },
  },
  {
    id: "doge-usd",
    symbol: "DOGE/USD",
    label: "Dogecoin",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "DOGE", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "DOGE" },
    aiDisplayName: "Dogecoin (DOGE/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.DOGE.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "DOGE" },
  },
  {
    id: "avax-usd",
    symbol: "AVAX/USD",
    label: "Avalanche",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "AVAX", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "AVAX" },
    aiDisplayName: "Avalanche (AVAX/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.AVAX.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "AVAX" },
  },
  {
    id: "matic-usd",
    symbol: "MATIC/USD",
    label: "Polygon",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "MATIC", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "MATIC" },
    aiDisplayName: "Polygon (MATIC/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.MATIC.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "MATIC" },
  },
  {
    id: "dot-usd",
    symbol: "DOT/USD",
    label: "Polkadot",
    category: ASSET_CATEGORIES.CRYPTO,
    base: { code: "DOT", kind: "crypto" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "crypto", code: "DOT" },
    aiDisplayName: "Polkadot (DOT/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.COINGECKO,
      coinId: CRYPTO_META.DOT.coingeckoId,
      vsCurrency: "usd",
    },
    converter: { type: CONVERTER_UNIT_TYPES.CRYPTO, code: "DOT" },
  },

  // Forex majors (converter + chat context; chart support prepared but not enabled yet)
  {
    id: "eur-usd",
    symbol: "EUR/USD",
    label: "EUR / USD",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "EUR", kind: "fiat" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "forex", base: "EUR", quote: "USD" },
    aiDisplayName: "EUR/USD",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "EUR" },
  },
  {
    id: "gbp-usd",
    symbol: "GBP/USD",
    label: "GBP / USD",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "GBP", kind: "fiat" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "forex", base: "GBP", quote: "USD" },
    aiDisplayName: "GBP/USD",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "GBP" },
  },
  {
    id: "usd-jpy",
    symbol: "USD/JPY",
    label: "USD / JPY",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "USD", kind: "fiat" },
    quote: { code: "JPY", kind: "fiat" },
    icon: { type: "forex", base: "USD", quote: "JPY" },
    aiDisplayName: "USD/JPY",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "JPY" },
  },
  {
    id: "usd-chf",
    symbol: "USD/CHF",
    label: "USD / CHF",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "USD", kind: "fiat" },
    quote: { code: "CHF", kind: "fiat" },
    icon: { type: "forex", base: "USD", quote: "CHF" },
    aiDisplayName: "USD/CHF",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "CHF" },
  },
  {
    id: "aud-usd",
    symbol: "AUD/USD",
    label: "AUD / USD",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "AUD", kind: "fiat" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "forex", base: "AUD", quote: "USD" },
    aiDisplayName: "AUD/USD",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "AUD" },
  },
  {
    id: "usd-cad",
    symbol: "USD/CAD",
    label: "USD / CAD",
    category: ASSET_CATEGORIES.FOREX,
    base: { code: "USD", kind: "fiat" },
    quote: { code: "CAD", kind: "fiat" },
    icon: { type: "forex", base: "USD", quote: "CAD" },
    aiDisplayName: "USD/CAD",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.FIAT, code: "CAD" },
  },

  // Precious metals (converter + chat context; chart support prepared but not enabled yet)
  {
    id: "xau-usd",
    symbol: "XAU/USD",
    label: "Gold (XAU/USD)",
    category: ASSET_CATEGORIES.METALS,
    base: { code: "XAU", kind: "metal" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "metal", code: "XAU" },
    aiDisplayName: "Gold (XAU/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.METAL, code: "GOLD_OUNCE" },
  },
  {
    id: "xag-usd",
    symbol: "XAG/USD",
    label: "Silver (XAG/USD)",
    category: ASSET_CATEGORIES.METALS,
    base: { code: "XAG", kind: "metal" },
    quote: { code: "USD", kind: "fiat" },
    icon: { type: "metal", code: "XAG" },
    aiDisplayName: "Silver (XAG/USD)",
    chart: {
      supported: true,
      provider: CHART_PROVIDERS.CURRENCYAPI,
      baseCurrency: "USD",
    },
    converter: { type: CONVERTER_UNIT_TYPES.METAL, code: "SILVER_OUNCE" },
  },
];

export const DEFAULT_INSTRUMENT_ID = INSTRUMENT_CATALOG[0]?.id || "btc-usd";

export function getInstrumentById(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  return INSTRUMENT_CATALOG.find((a) => a.id === key) || null;
}

export function getChartSupportedInstruments() {
  return INSTRUMENT_CATALOG.filter((a) => Boolean(a?.chart?.supported));
}

export function formatInstrumentPairLabel(asset) {
  if (!asset) return "Asset";
  const base = asset?.base?.code || "";
  const quote = asset?.quote?.code || "";
  if (base && quote) return `${base}/${quote}`;
  return asset.symbol || asset.id || "Asset";
}

export function getFiatLabel(code) {
  const c = String(code || "").trim().toUpperCase();
  return FIAT_META?.[c]?.label || c || "";
}

export function getFiatFlag(code) {
  const c = String(code || "").trim().toUpperCase();
  return FIAT_META?.[c]?.flag || "";
}

export function getCryptoLabel(symbol) {
  const s = String(symbol || "").trim().toUpperCase();
  return CRYPTO_META?.[s]?.label || s || "";
}

export function getCryptoBrandColor(symbol) {
  const s = String(symbol || "").trim().toUpperCase();
  return CRYPTO_META?.[s]?.brandColor || "";
}

export function getCryptoCoinId(symbol) {
  const s = String(symbol || "").trim().toUpperCase();
  return CRYPTO_META?.[s]?.coingeckoId || "";
}

export function getMetalLabel(code) {
  const c = String(code || "").trim().toUpperCase();
  return METAL_META?.[c]?.label || c || "";
}

export function getMetalShort(code) {
  const c = String(code || "").trim().toUpperCase();
  return METAL_META?.[c]?.short || c || "";
}

// Converter units (used by the universal converter UI)
export const CONVERTER_UNIT_CATALOG = {
  [CONVERTER_UNIT_TYPES.FIAT]: [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CHF",
    "AUD",
    "CAD",
    // Common extras already used in the app
    "TRY",
    "SYP",
    "AED",
    "SAR",
    "EGP",
  ].map((code) => ({
    code,
    label: getFiatLabel(code),
    icon: { type: "fiat", code },
  })),
  [CONVERTER_UNIT_TYPES.CRYPTO]: [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "DOGE",
    "AVAX",
    "MATIC",
    "DOT",
    // Common extras already used in the app converter.
    "USDT",
    "BUSD",
  ].map((code) => ({
    code,
    label: getCryptoLabel(code),
    icon: { type: "crypto", code },
    coingeckoId: getCryptoCoinId(code),
  })),
  [CONVERTER_UNIT_TYPES.METAL]: [
    { code: "GOLD_OUNCE", label: "Gold (oz)", icon: { type: "metalUnit", metal: "XAU" } },
    { code: "GOLD_GRAM", label: "Gold (g)", icon: { type: "metalUnit", metal: "XAU" } },
    { code: "SILVER_OUNCE", label: "Silver (oz)", icon: { type: "metalUnit", metal: "XAG" } },
    { code: "SILVER_GRAM", label: "Silver (g)", icon: { type: "metalUnit", metal: "XAG" } },
  ],
};

export function getConverterUnits(type) {
  return CONVERTER_UNIT_CATALOG[type] || [];
}

export function getConverterUnit(type, code) {
  const items = getConverterUnits(type);
  const key = String(code || "").trim().toUpperCase();
  return items.find((i) => String(i.code || "").toUpperCase() === key) || null;
}
