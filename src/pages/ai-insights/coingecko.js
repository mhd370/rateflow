const COINGECKO_API_BASES = [
  "https://api.coingecko.com/api/v3",
  "https://www.coingecko.com/api/v3",
];

class HttpError extends Error {
  constructor(message, { status, statusText, url }) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

function createNoDataError(message) {
  const err = new Error(message);
  err.code = "NO_DATA";
  return err;
}

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
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    },
  };
}

async function fetchJson(url, { signal, timeoutMs = 12000 } = {}) {
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(signal, timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: combinedSignal,
    });

    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status} ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        url,
      });
    }

    return await res.json();
  } finally {
    cleanup();
  }
}

function toCandleTimeSeconds(timeMs) {
  return Math.floor(Number(timeMs) / 1000);
}

function normalizeCandles(candles) {
  const map = new Map();

  for (const c of candles || []) {
    if (!c) continue;
    const time = Number(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);

    if (!Number.isFinite(time)) continue;
    if (![open, high, low, close].every(Number.isFinite)) continue;

    map.set(time, { time, open, high, low, close });
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

function mapCoinGeckoOhlcResponse(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected OHLC response");
  }

  const candles = raw
    .map((row) => {
      if (!Array.isArray(row) || row.length < 5) return null;
      const [timeMs, open, high, low, close] = row;
      return {
        time: toCandleTimeSeconds(timeMs),
        open,
        high,
        low,
        close,
      };
    })
    .filter(Boolean);

  return normalizeCandles(candles);
}

function deriveCandlesFromPrices(prices) {
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error("Not enough price points to derive candles");
  }

  const candles = [];

  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (!Array.isArray(prev) || !Array.isArray(curr)) continue;

    const time = toCandleTimeSeconds(curr[0]);
    const open = Number(prev[1]);
    const close = Number(curr[1]);

    if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(close)) continue;

    candles.push({
      time,
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
      close,
    });
  }

  return normalizeCandles(candles);
}

export function formatMarketDataError(err) {
  if (!err) return "Unknown error";
  if (err.name === "AbortError") return "Request cancelled.";
  if (String(err?.code) === "NO_DATA") return "No data returned for this asset/timeframe.";

  if (err.name === "HttpError" && typeof err.status === "number") {
    if (err.status === 429) return "Rate limited by CoinGecko (HTTP 429). Try again shortly.";
    if (err.status === 403) return "Request blocked (HTTP 403). Try a different network.";
    if (err.status >= 500) return "CoinGecko server error. Try again shortly.";
    return `Request failed (HTTP ${err.status}).`;
  }

  const msg = String(err.message || "");
  if (msg.includes("Failed to fetch")) {
    return "Network/CORS error (Failed to fetch). CoinGecko may be blocked by your network - try again or use a backend proxy.";
  }
  return msg || "Unknown error";
}

async function tryFetchFromBases(path, options) {
  let lastErr;

  for (const base of COINGECKO_API_BASES) {
    const url = `${base}${path}`;
    try {
      return { data: await fetchJson(url, options), url };
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("Request failed");
}

export async function fetchCoinGeckoCandles({
  coinId,
  vsCurrency,
  days,
  signal,
  timeoutMs,
} = {}) {
  if (!coinId) throw new Error("coinId is required");
  if (!vsCurrency) throw new Error("vsCurrency is required");
  if (!days) throw new Error("days is required");

  try {
    const { data } = await tryFetchFromBases(
      `/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=${encodeURIComponent(
        vsCurrency,
      )}&days=${encodeURIComponent(days)}`,
      { signal, timeoutMs },
    );

    const candles = mapCoinGeckoOhlcResponse(data);
    if (!candles.length) throw createNoDataError("CoinGecko returned no OHLC candles.");
    return { candles, source: "coingecko-ohlc" };
  } catch (err) {
    const interval = Number(days) >= 30 ? "daily" : undefined;
    const intervalParam = interval ? `&interval=${encodeURIComponent(interval)}` : "";

    const { data } = await tryFetchFromBases(
      `/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${encodeURIComponent(
        vsCurrency,
      )}&days=${encodeURIComponent(days)}${intervalParam}`,
      { signal, timeoutMs },
    );

    let candles;
    try {
      candles = deriveCandlesFromPrices(data?.prices);
    } catch (innerErr) {
      const e = createNoDataError(
        innerErr?.message || "CoinGecko returned no market_chart prices.",
      );
      e.cause = innerErr;
      throw e;
    }
    if (!candles.length) throw createNoDataError("CoinGecko returned no market_chart prices.");
    return { candles, source: "coingecko-derived" };
  }
}
