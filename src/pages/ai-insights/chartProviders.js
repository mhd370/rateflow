import { fetchCoinGeckoCandles } from "./coingecko";

const CURRENCY_API_BASE_URL = "https://api.currencyapi.com/v3/latest";

function createTimeoutSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function fetchJson(url, { signal, timeoutMs = 12000, headers } = {}) {
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", headers, signal: combinedSignal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.name = "HttpError";
      err.status = res.status;
      err.body = text;
      err.url = url;
      throw err;
    }
    return await res.json();
  } finally {
    cleanup();
  }
}

function normalizeCurrencyApiKey() {
  const fromEnv = String(process.env.REACT_APP_CURRENCY_API_KEY || "").trim();
  return fromEnv;
}

async function fetchCurrencyApiRates({ baseCurrency = "USD", currencies, signal, timeoutMs } = {}) {
  const apiKey = normalizeCurrencyApiKey();
  if (!apiKey) {
    const err = new Error("Missing CurrencyAPI key.");
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const url = new URL(CURRENCY_API_BASE_URL);
  url.searchParams.set("base_currency", baseCurrency);
  if (Array.isArray(currencies) && currencies.length) {
    url.searchParams.set("currencies", currencies.join(","));
  }

  const data = await fetchJson(url.toString(), {
    signal,
    timeoutMs: timeoutMs || 12000,
    headers: { apikey: apiKey, accept: "application/json" },
  });

  if (data?.error) {
    const err = new Error(data.error?.message || "CurrencyAPI error.");
    err.code = "API_ERROR";
    throw err;
  }

  return data?.data || {};
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intervalSecondsForDays(days) {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 1) return 60; // 1m
  if (d <= 7) return 300; // 5m
  if (d <= 30) return 900; // 15m
  return 3600; // 1h
}

function computeCurrencyApiSpotPrice(instrument, rates) {
  const baseCode = String(instrument?.base?.code || "").toUpperCase();
  const quoteCode = String(instrument?.quote?.code || "").toUpperCase();

  if (!baseCode || !quoteCode) return null;

  // Rates returned are "units per 1 USD" when base_currency=USD.
  // For pairs like EUR/USD (USD per 1 EUR): price = 1 / (EUR per USD).
  // For pairs like USD/JPY (JPY per 1 USD): price = (JPY per USD).
  const getRate = (code) => {
    if (code === "USD") return 1;
    const v = toNumber(rates?.[code]?.value);
    return v && v > 0 ? v : null;
  };

  // Metals use CurrencyAPI codes XAU/XAG as units per USD (troy ounce units).
  const isMetal = baseCode === "XAU" || baseCode === "XAG";
  if (isMetal && quoteCode === "USD") {
    const metalPerUsd = getRate(baseCode);
    if (!metalPerUsd) return null;
    return 1 / metalPerUsd; // USD per 1 XAU/XAG
  }

  if (baseCode === "USD") {
    return getRate(quoteCode);
  }
  if (quoteCode === "USD") {
    const basePerUsd = getRate(baseCode);
    if (!basePerUsd) return null;
    return 1 / basePerUsd;
  }

  return null;
}

function createUnsupportedError(instrument) {
  const err = new Error("Chart data is not available for this asset yet.");
  err.code = "CHART_UNSUPPORTED";
  err.instrumentId = instrument?.id;
  err.category = instrument?.category;
  return err;
}

export function isChartSupported(instrument) {
  return Boolean(instrument?.chart?.supported) && Boolean(instrument?.chart?.provider);
}

export async function fetchInstrumentSpot({ instrument, signal, timeoutMs = 12000 } = {}) {
  if (!instrument) throw createUnsupportedError(null);

  const provider = instrument?.chart?.provider;
  if (provider !== "currencyapi") throw createUnsupportedError(instrument);

  const baseCurrency = instrument?.chart?.baseCurrency || "USD";
  const baseCode = String(instrument?.base?.code || "").toUpperCase();
  const quoteCode = String(instrument?.quote?.code || "").toUpperCase();

  // Always fetch via USD base for predictable conversion logic.
  const currencies = Array.from(
    new Set(
      [baseCode, quoteCode]
        .filter(Boolean)
        .map((c) => String(c).toUpperCase())
        .filter((c) => c && c !== "USD"),
    ),
  );
  const rates = await fetchCurrencyApiRates({
    baseCurrency: baseCurrency || "USD",
    currencies,
    signal,
    timeoutMs,
  });

  const price = computeCurrencyApiSpotPrice(instrument, rates);
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    const err = new Error("No spot price returned for this instrument.");
    err.code = "NO_DATA";
    throw err;
  }

  return {
    price: Number(price),
    asOf: new Date(),
    source: "currencyapi-spot",
  };
}

export async function fetchInstrumentCandles({
  instrument,
  days,
  signal,
  timeoutMs = 12000,
} = {}) {
  if (!instrument) throw createUnsupportedError(null);

  const provider = instrument?.chart?.provider;
  if (!provider) throw createUnsupportedError(instrument);

  if (provider === "coingecko") {
    const coinId = instrument?.chart?.coinId;
    const vsCurrency = instrument?.chart?.vsCurrency || "usd";
    if (!coinId) throw createUnsupportedError(instrument);

    return fetchCoinGeckoCandles({
      coinId,
      vsCurrency,
      days,
      signal,
      timeoutMs,
    });
  }

  if (provider === "currencyapi") {
    const spot = await fetchInstrumentSpot({ instrument, signal, timeoutMs });
    const intervalSec = intervalSecondsForDays(days);
    const nowSec = Math.floor(Date.now() / 1000);
    const bucketStart = intervalSec > 0 ? nowSec - (nowSec % intervalSec) : nowSec;
    const p = Number(spot.price);

    return {
      candles: [{ time: bucketStart, open: p, high: p, low: p, close: p }],
      source: "currencyapi-spot",
    };
  }

  throw createUnsupportedError(instrument);
}
