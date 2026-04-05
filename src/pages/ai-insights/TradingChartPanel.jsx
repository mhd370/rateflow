import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useTranslation } from "react-i18next";

import LightweightCandlesChart from "./LightweightCandlesChart";
import { formatMarketDataError } from "./coingecko";
import { fetchInstrumentCandles, fetchInstrumentSpot } from "./chartProviders";
import { analyzeMarketCandles } from "./analysisEngine";
import { analyzeTargetLevels } from "./targetAnalysisEngine";
import MarketAnalysisPanel from "./MarketAnalysisPanel";
import MarketStatsBar from "./MarketStatsBar";
import AIChatPanel from "./AIChatPanel";
import SelectedPointAnalysisPanel from "./SelectedPointAnalysisPanel";
import TargetAnalysisModal from "./TargetAnalysisModal";
import AssetIcon from "../../components/AssetIcon";
import {
  DEFAULT_INSTRUMENT_ID,
  formatInstrumentPairLabel,
  getChartSupportedInstruments,
  getInstrumentById,
} from "../../assets/assetCatalog";

const TIMEFRAMES = [
  { id: "1D", label: "1D", days: 1 },
  { id: "7D", label: "7D", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
];

function computeMarketStats(candles) {
  const arr = Array.isArray(candles) ? candles : [];
  if (arr.length < 2) return null;

  const first = arr[0];
  const last = arr[arr.length - 1];

  const firstOpen = Number(first?.open);
  const firstClose = Number(first?.close);
  const start = Number.isFinite(firstOpen) ? firstOpen : firstClose;

  const close = Number(last?.close);
  const endTime = Number(last?.time);

  let high = -Infinity;
  let low = Infinity;

  for (const c of arr) {
    const h = Number(c?.high);
    const l = Number(c?.low);
    if (Number.isFinite(h) && h > high) high = h;
    if (Number.isFinite(l) && l < low) low = l;
  }

  const changePct =
    start > 0 && Number.isFinite(close) ? ((close - start) / start) * 100 : null;

  return {
    points: arr.length,
    start,
    close: Number.isFinite(close) ? close : null,
    high: Number.isFinite(high) ? high : null,
    low: Number.isFinite(low) ? low : null,
    changePct,
    endTime: Number.isFinite(endTime) ? endTime : null,
  };
}

function roundToDigits(value, digits) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const d = Number.isFinite(Number(digits)) ? Math.max(0, Number(digits)) : 2;
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

function inferPriceDigits(reference) {
  const n = Number(reference);
  if (!Number.isFinite(n) || n <= 0) return 2;
  if (n >= 1000) return 0;
  if (n >= 1) return 2;
  return 6;
}

function inferCandleIntervalSeconds(candles) {
  const arr = Array.isArray(candles) ? candles : [];
  if (arr.length < 3) return null;

  const diffs = [];
  const start = Math.max(1, arr.length - 32);
  for (let i = start; i < arr.length; i += 1) {
    const prev = Number(arr[i - 1]?.time);
    const curr = Number(arr[i]?.time);
    const d = curr - prev;
    if (Number.isFinite(d) && d > 0) diffs.push(d);
  }
  if (!diffs.length) return null;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}

function liveIntervalFallbackSeconds(days) {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 1) return 300; // 5m
  if (d <= 7) return 3600; // 1h
  if (d <= 30) return 14400; // 4h
  return 86400; // 1d
}

function applyLivePriceToCandles(prevCandles, { price, timeSec, intervalSec } = {}) {
  const p = Number(price);
  const t = Math.floor(Number(timeSec));
  const interval = Math.floor(Number(intervalSec));

  if (!Number.isFinite(p) || p <= 0) return prevCandles;
  if (!Number.isFinite(t) || t <= 0) return prevCandles;

  const arr = Array.isArray(prevCandles) ? prevCandles : [];
  const next = arr.slice();

  if (!next.length) {
    const start = Number.isFinite(interval) && interval > 0 ? t - (t % interval) : t;
    return [{ time: start, open: p, high: p, low: p, close: p }];
  }

  const last = next[next.length - 1];
  const lastTime = Math.floor(Number(last?.time));
  if (!Number.isFinite(lastTime)) return prevCandles;

  const safeInterval = Number.isFinite(interval) && interval > 0 ? interval : null;

  const updateLast = () => {
    const open = Number(last?.open);
    const high0 = Number(last?.high);
    const low0 = Number(last?.low);
    const close0 = Number(last?.close);

    const high = Math.max(
      Number.isFinite(high0) ? high0 : p,
      Number.isFinite(open) ? open : p,
      Number.isFinite(close0) ? close0 : p,
      p,
    );
    const low = Math.min(
      Number.isFinite(low0) ? low0 : p,
      Number.isFinite(open) ? open : p,
      Number.isFinite(close0) ? close0 : p,
      p,
    );

    next[next.length - 1] = {
      time: lastTime,
      open: Number.isFinite(open) ? open : p,
      high,
      low,
      close: p,
    };
  };

  if (!safeInterval) {
    updateLast();
    return next;
  }

  if (t >= lastTime + safeInterval) {
    const steps = Math.max(1, Math.floor((t - lastTime) / safeInterval));
    const bucketStart = lastTime + steps * safeInterval;
    next.push({ time: bucketStart, open: p, high: p, low: p, close: p });
    return next;
  }

  updateLast();
  return next;
}

const BINANCE_TRADE_STREAM_BY_BASE = {
  BTC: "btcusdt",
  ETH: "ethusdt",
  SOL: "solusdt",
  BNB: "bnbusdt",
  XRP: "xrpusdt",
  ADA: "adausdt",
  DOGE: "dogeusdt",
  AVAX: "avaxusdt",
  MATIC: "maticusdt",
  DOT: "dotusdt",
};

export default function TradingChartPanel() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const chartInstruments = React.useMemo(() => getChartSupportedInstruments(), []);
  const chartInstrumentGroups = React.useMemo(() => {
    const groups = { crypto: [], forex: [], metals: [], other: [] };
    for (const item of chartInstruments) {
      const category = String(item?.category || "").toLowerCase();
      if (category === "crypto") groups.crypto.push(item);
      else if (category === "forex") groups.forex.push(item);
      else if (category === "metals") groups.metals.push(item);
      else groups.other.push(item);
    }

    const labelFor = (key) => {
      if (key === "crypto") return t("assets.category.crypto", "Crypto");
      if (key === "forex") return t("assets.category.forex", "Forex");
      if (key === "metals") return t("assets.category.metals", "Metals");
      return t("assets.category.other", "Other");
    };

    return ["crypto", "forex", "metals", "other"]
      .map((key) => ({ key, label: labelFor(key), items: groups[key] || [] }))
      .filter((g) => g.items.length);
  }, [chartInstruments, t]);

  const [assetId, setAssetId] = React.useState(DEFAULT_INSTRUMENT_ID);
  const [timeframe, setTimeframe] = React.useState("1M");
  const [selectedCandle, setSelectedCandle] = React.useState(null);
  const [targetMode, setTargetMode] = React.useState(false);
  const [placingTarget, setPlacingTarget] = React.useState(null);
  const [target1, setTarget1] = React.useState(null);
  const [target2, setTarget2] = React.useState(null);
  const [targetAnalysisOpen, setTargetAnalysisOpen] = React.useState(false);
  const [targetAnalysisResult, setTargetAnalysisResult] = React.useState(null);
  const [targetAnalysisContext, setTargetAnalysisContext] = React.useState(null);

  const instrument = React.useMemo(() => {
    return (
      getInstrumentById(assetId) ||
      getInstrumentById(DEFAULT_INSTRUMENT_ID) ||
      chartInstruments[0] ||
      null
    );
  }, [assetId, chartInstruments]);

  const assetLabel = formatInstrumentPairLabel(instrument);
  const chartProvider = instrument?.chart?.provider || "unknown";
  const chartAssetKey =
    chartProvider === "coingecko" ? instrument?.chart?.coinId || "bitcoin" : instrument?.id || "";
  const vsCurrency =
    instrument?.chart?.vsCurrency || String(instrument?.quote?.code || "usd").toLowerCase();

  const tf =
    TIMEFRAMES.find((t) => t.id === timeframe) || TIMEFRAMES.find((t) => t.id === "1M");
  const tfId = tf?.id;
  const tfLabel = tf?.label;
  const tfDays = tf?.days;

  const [candles, setCandles] = React.useState([]);
  const [dataState, setDataState] = React.useState({
    loading: true,
    error: "",
    errorCode: "",
    source: "",
    lastUpdated: null,
  });

  const candlesRef = React.useRef([]);
  React.useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  const prevRequestKeyRef = React.useRef(
    `${chartProvider}|${chartAssetKey}|${tfDays}|${vsCurrency}`,
  );
  const candlesCacheRef = React.useRef(new Map());

  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let inFlight = false;
    let requestSeq = 0;
    let pollTimer = null;

    const requestKey = `${chartProvider}|${chartAssetKey}|${tfDays}|${vsCurrency}`;
    const cached = candlesCacheRef.current.get(requestKey);

    const shouldPollHistory = chartProvider === "coingecko";
    const pollMs = shouldPollHistory
      ? tfDays <= 1
        ? 20000
        : tfDays <= 7
          ? 30000
          : tfDays <= 30
            ? 60000
            : 90000
      : null;

    async function load() {
      if (inFlight) return;
      inFlight = true;
      requestSeq += 1;
      const seq = requestSeq;

      const requestChanged = prevRequestKeyRef.current !== requestKey;
      prevRequestKeyRef.current = requestKey;
      if (requestChanged) {
        setSelectedCandle(null);
        if (cached?.candles?.length) setCandles(cached.candles);
        else setCandles([]);
      }

      setDataState((s) => ({
        ...s,
        loading: true,
        error: "",
        errorCode: "",
        source: cached?.source || s.source,
        lastUpdated: cached?.lastUpdated || s.lastUpdated,
      }));

      try {
        const result = await fetchInstrumentCandles({
          instrument,
          days: tfDays,
          signal: controller.signal,
          timeoutMs: 12000,
        });

        if (!active || seq !== requestSeq) return;

        const now = new Date();
        candlesCacheRef.current.set(requestKey, {
          candles: result.candles,
          source: result.source,
          lastUpdated: now,
        });

        setCandles(result.candles);
        setDataState({
          loading: false,
          error: "",
          errorCode: "",
          source: result.source,
          lastUpdated: now,
        });
      } catch (err) {
        if (!active || seq !== requestSeq) return;
        const isTimeout = err?.name === "AbortError";

        (isTimeout ? console.warn : console.error)(
          "[AI Insights][Chart] Market data fetch failed",
          {
            instrumentId: instrument?.id,
            provider: chartProvider,
            assetKey: chartAssetKey,
            vsCurrency,
            days: tfDays,
            code: err?.code,
            status: err?.status,
            name: err?.name,
            message: err?.message,
          },
          err,
        );

        const friendly = isTimeout
          ? t(
              "aiInsights.errors.timeoutFetch",
              "Request timed out while loading CoinGecko data. Try again shortly.",
            )
          : formatMarketDataError(err);

        let errorCode = String(err?.code || "");
        if (!errorCode && err?.name === "HttpError" && typeof err?.status === "number") {
          if (err.status === 429) errorCode = "RATE_LIMIT";
          else if (err.status === 403) errorCode = "BLOCKED";
          else errorCode = `HTTP_${err.status}`;
        }
        if (!errorCode && isTimeout) errorCode = "TIMEOUT";
        const cachedNow = candlesCacheRef.current.get(requestKey);

        if (cachedNow?.candles?.length) {
          setCandles(cachedNow.candles);
          setDataState((s) => ({
            ...s,
            loading: false,
            error: friendly,
            errorCode,
            source: cachedNow.source || s.source,
            lastUpdated: cachedNow.lastUpdated || s.lastUpdated,
          }));
          return;
        }

        setDataState((s) => ({ ...s, loading: false, error: friendly, errorCode }));
      } finally {
        inFlight = false;
      }
    }

    load();
    if (shouldPollHistory && pollMs) {
      pollTimer = setInterval(() => {
        if (!active) return;
        load();
      }, pollMs);
    }

    return () => {
      active = false;
      controller.abort();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [instrument, chartProvider, chartAssetKey, tfDays, vsCurrency, t]);

  React.useEffect(() => {
    if (!candles.length) return;
    setSelectedCandle((prev) => {
      if (!prev) return prev;
      const time = Math.floor(Number(prev?.time));
      if (!Number.isFinite(time)) return prev;

      const match = candles.find((c) => Math.floor(Number(c?.time)) === time);
      if (!match) return prev;

      const same =
        Number(match.open) === Number(prev.open) &&
        Number(match.high) === Number(prev.high) &&
        Number(match.low) === Number(prev.low) &&
        Number(match.close) === Number(prev.close);

      return same ? prev : match;
    });
  }, [candles]);

  // Near-live polling for non-crypto instruments (CurrencyAPI spot).
  React.useEffect(() => {
    if (!instrument) return undefined;
    if (chartProvider !== "currencyapi") return undefined;

    let active = true;
    let inFlight = false;
    const controller = new AbortController();

    const requestKey = `${chartProvider}|${chartAssetKey}|${tfDays}|${vsCurrency}`;
    const pollMs = 8000; // 5-10s target
    const candleIntervalSec =
      tfDays <= 1 ? 60 : tfDays <= 7 ? 300 : tfDays <= 30 ? 900 : 3600;

    async function poll() {
      if (inFlight) return;
      inFlight = true;
      try {
        const spot = await fetchInstrumentSpot({
          instrument,
          signal: controller.signal,
          timeoutMs: 10000,
        });
        if (!active) return;

        const asOf = spot?.asOf instanceof Date ? spot.asOf : new Date();
        const timeSec = Math.floor(asOf.getTime() / 1000);
        const price = Number(spot?.price);

        setCandles((prev) => {
          const next = applyLivePriceToCandles(prev, {
            price,
            timeSec,
            intervalSec: candleIntervalSec,
          });
          candlesCacheRef.current.set(requestKey, {
            candles: next,
            source: spot?.source || "currencyapi-spot",
            lastUpdated: asOf,
          });
          return next;
        });

        setDataState((s) => ({
          ...s,
          loading: false,
          error: "",
          errorCode: "",
          source: s.source || spot?.source || "currencyapi-spot",
          lastUpdated: asOf,
        }));
      } catch (err) {
        if (!active) return;
        console.error("[AI Insights][Chart] CurrencyAPI live poll failed", {
          instrumentId: instrument?.id,
          code: err?.code,
          status: err?.status,
          message: err?.message,
        });

        setDataState((s) => ({
          ...s,
          loading: false,
          error: String(err?.message || "Live price polling failed."),
          errorCode: s.errorCode || String(err?.code || "LIVE_POLL_FAILED"),
        }));
      } finally {
        inFlight = false;
      }
    }

    poll();
    const timer = setInterval(poll, pollMs);

    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [instrument, chartProvider, chartAssetKey, tfDays, vsCurrency]);

  // True live updates for crypto via WebSocket trade feed (updates the latest candle in-place).
  React.useEffect(() => {
    if (!instrument) return undefined;
    if (chartProvider !== "coingecko") return undefined;
    if (instrument.category !== "crypto") return undefined;

    const base = String(instrument?.base?.code || "").toUpperCase();
    const stream = BINANCE_TRADE_STREAM_BY_BASE[base];
    if (!stream) return undefined;

    const requestKey = `${chartProvider}|${chartAssetKey}|${tfDays}|${vsCurrency}`;

    let active = true;
    let ws = null;
    let reconnectTimer = null;
    let flushTimer = null;
    let reconnectAttempts = 0;

    const pendingRef = { price: null, timeSec: null };

    const flush = () => {
      const price = Number(pendingRef.price);
      const timeSec = Number(pendingRef.timeSec);
      if (!Number.isFinite(price) || price <= 0) return;

      // Clear pending tick (we keep the most recent one)
      pendingRef.price = null;
      pendingRef.timeSec = null;

      const inferred =
        inferCandleIntervalSeconds(candlesRef.current) || liveIntervalFallbackSeconds(tfDays);

      const asOfSec = Number.isFinite(timeSec) ? Math.floor(timeSec) : Math.floor(Date.now() / 1000);
      const asOf = new Date(asOfSec * 1000);

      setCandles((prev) => {
        const next = applyLivePriceToCandles(prev, {
          price,
          timeSec: asOfSec,
          intervalSec: inferred,
        });
        const cached = candlesCacheRef.current.get(requestKey);
        candlesCacheRef.current.set(requestKey, {
          candles: next,
          source: cached?.source || "binance-ws",
          lastUpdated: asOf,
        });
        return next;
      });

      setDataState((s) => ({
        ...s,
        loading: false,
        error: "",
        errorCode: "",
        lastUpdated: asOf,
      }));
    };

    const scheduleReconnect = () => {
      if (!active) return;
      if (reconnectTimer) return;
      const delay = Math.min(20000, 1000 * 2 ** reconnectAttempts);
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(() => {
        if (!active) return;
        connect();
      }, delay);
    };

    const connect = () => {
      try {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = null;

        if (ws) {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }

        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}@trade`);

        ws.onopen = () => {
          reconnectAttempts = 0;
        };

        ws.onmessage = (evt) => {
          if (!active) return;
          try {
            const msg = JSON.parse(String(evt?.data || "{}"));
            const price = Number(msg?.p);
            const tMs = Number(msg?.T);
            if (!Number.isFinite(price) || price <= 0) return;
            pendingRef.price = price;
            pendingRef.timeSec = Number.isFinite(tMs) ? Math.floor(tMs / 1000) : Math.floor(Date.now() / 1000);
          } catch {
            // ignore parse errors
          }
        };

        ws.onerror = () => {
          scheduleReconnect();
        };

        ws.onclose = () => {
          scheduleReconnect();
        };
      } catch (err) {
        console.warn("[AI Insights][Chart] WebSocket init failed; falling back to polling.", err);
      }
    };

    connect();
    flushTimer = setInterval(flush, 400);

    return () => {
      active = false;
      if (flushTimer) clearInterval(flushTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        if (ws) ws.close();
      } catch {
        // ignore
      }
      ws = null;
    };
  }, [instrument, chartProvider, chartAssetKey, tfDays, vsCurrency]);

  const marketStats = React.useMemo(() => computeMarketStats(candles), [candles]);
  const priceDigits = React.useMemo(
    () => inferPriceDigits(marketStats?.close),
    [marketStats?.close],
  );

  const analysis = React.useMemo(
    () =>
      analyzeMarketCandles({
        candles,
        timeframeDays: tfDays,
      }),
    [candles, tfDays],
  );

  const targetLines = React.useMemo(() => {
    if (!targetMode) return [];
    const t1 = Number(target1);
    const t2 = Number(target2);
    const lines = [];
    if (Number.isFinite(t1)) {
      lines.push({
        key: "target-1",
        price: t1,
        title: t("aiInsights.targets.target1Short", "T1"),
        color: "rgba(251,191,36,0.95)",
        lineWidth: 2,
        lineStyle: 0,
      });
    }
    if (Number.isFinite(t2)) {
      lines.push({
        key: "target-2",
        price: t2,
        title: t("aiInsights.targets.target2Short", "T2"),
        color: "rgba(167,139,250,0.95)",
        lineWidth: 2,
        lineStyle: 0,
      });
    }
    return lines;
  }, [targetMode, target1, target2, t]);

  const marketContext = React.useMemo(() => {
    const selectedPoint =
      selectedCandle &&
      Number.isFinite(Number(selectedCandle?.time)) &&
      [selectedCandle?.open, selectedCandle?.high, selectedCandle?.low, selectedCandle?.close].every(
        (v) => Number.isFinite(Number(v)),
      )
        ? {
            time: Math.floor(Number(selectedCandle.time)),
            open: Number(selectedCandle.open),
            high: Number(selectedCandle.high),
            low: Number(selectedCandle.low),
            close: Number(selectedCandle.close),
          }
        : null;

    return {
      uiLanguage: i18n.language,
      asset: instrument
        ? {
            id: instrument.id,
            name: instrument.label,
            symbol: instrument.symbol,
            category: instrument.category,
            base: instrument.base?.code,
            quote: instrument.quote?.code,
            vsCurrency,
            pairLabel: assetLabel,
            aiDisplayName: instrument.aiDisplayName,
          }
        : null,
      timeframe: tfId
        ? {
            id: tfId,
            label: tfLabel,
            days: tfDays,
          }
        : null,
      marketStats,
      analysis,
      selectedPoint,
      targets:
        targetMode &&
        (Number.isFinite(Number(target1)) || Number.isFinite(Number(target2)))
          ? {
              target1: Number.isFinite(Number(target1)) ? Number(target1) : null,
              target2: Number.isFinite(Number(target2)) ? Number(target2) : null,
            }
          : null,
      data: {
        loading: Boolean(dataState.loading),
        error: dataState.error || "",
        errorCode: dataState.errorCode || "",
        source: dataState.source || "",
        lastUpdated: dataState.lastUpdated
          ? new Date(dataState.lastUpdated).toISOString()
          : null,
      },
    };
  }, [
    i18n.language,
    instrument,
    vsCurrency,
    assetLabel,
    tfId,
    tfLabel,
    tfDays,
    marketStats,
    analysis,
    selectedCandle,
    targetMode,
    target1,
    target2,
    dataState.loading,
    dataState.error,
    dataState.errorCode,
    dataState.source,
    dataState.lastUpdated,
  ]);

  const statusChipLabel = (() => {
    if (dataState.loading && !candles.length)
      return t("aiInsights.status.loadingData", "Loading data...");
    if (dataState.loading && candles.length) return t("aiInsights.status.updating", "Updating...");
    if (dataState.errorCode === "NO_DATA" && candles.length)
      return t("aiInsights.status.noDataCached", "No data returned | Cached");
    if (dataState.errorCode === "RATE_LIMIT" && candles.length)
      return t("aiInsights.status.rateLimitedCached", "Rate limited (cached)");
    if (dataState.errorCode === "RATE_LIMIT")
      return t("aiInsights.status.rateLimited", "Rate limited");
    if (dataState.errorCode === "TIMEOUT" && candles.length)
      return t("aiInsights.status.timeoutCached", "Timed out (cached)");
    if (dataState.errorCode === "TIMEOUT") return t("aiInsights.status.timeout", "Timed out");
    if (dataState.errorCode === "BLOCKED" && candles.length)
      return t("aiInsights.status.blockedCached", "Blocked (cached)");
    if (dataState.errorCode === "BLOCKED") return t("aiInsights.status.blocked", "Blocked");
    if (dataState.errorCode === "NO_DATA") return t("aiInsights.status.noData", "No data returned");
    if (dataState.error && candles.length)
      return t("aiInsights.status.liveFailedCached", "Live update failed | Cached");
    if (dataState.error) return t("aiInsights.status.dataUnavailable", "Data unavailable");
    if (String(dataState.source || "").startsWith("currencyapi"))
      return t("aiInsights.status.currencyapiSpot", { defaultValue: "CurrencyAPI | Spot" });
    if (dataState.source === "coingecko-derived")
      return t("aiInsights.status.coingeckoDerived", "CoinGecko | Derived");
    return t("aiInsights.status.coingeckoOhlc", "CoinGecko | OHLC");
  })();

  const handlePlaceTarget = React.useCallback(
    (price) => {
      if (!targetMode) return;
      const p = roundToDigits(price, priceDigits);
      if (!Number.isFinite(Number(p))) return;

      setPlacingTarget((current) => {
        if (current === "target1") setTarget1(p);
        else if (current === "target2") setTarget2(p);
        return null;
      });
    },
    [priceDigits, targetMode],
  );

  const clearTargets = React.useCallback(() => {
    setPlacingTarget(null);
    setTarget1(null);
    setTarget2(null);
  }, []);

  const canAnalyzeTargets =
    targetMode && Number.isFinite(Number(target1)) && Number.isFinite(Number(target2));

  const runTargetAnalysis = React.useCallback(() => {
    if (!canAnalyzeTargets) return;

    const result = analyzeTargetLevels({
      candles,
      timeframeDays: tfDays,
      target1,
      target2,
    });

    setTargetAnalysisResult(result);
    setTargetAnalysisContext({
      ...marketContext,
      targets: {
        target1: Number(target1),
        target2: Number(target2),
      },
      targetAnalysis: result,
    });
    setTargetAnalysisOpen(true);
  }, [canAnalyzeTargets, candles, tfDays, target1, target2, marketContext]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1fr) 380px",
          xl: "minmax(0, 1fr) 420px",
        },
        gap: { xs: 2.2, md: 2.4, xl: 2.6 },
        alignItems: "start",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Card
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(145deg, rgba(18,33,67,0.88) 0%, rgba(10,20,45,0.86) 55%, rgba(6,10,22,0.92) 100%)",
            boxShadow:
              "0 22px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
            mb: { xs: 2.2, md: 2.6 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: { xs: 2.2, md: 2.8 },
              py: 1.7,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ShowChartOutlinedIcon sx={{ color: "#39c6ff" }} />
              <Typography sx={{ fontWeight: 1000, fontSize: 16, letterSpacing: "-0.01em" }}>
                {t("aiInsights.chart.title", "Trading Chart")}
              </Typography>
            </Stack>

            <Chip
              label={t("aiInsights.chart.provider", "Lightweight Charts")}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(14,28,60,0.7)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            />
          </Box>

          {/* Controls */}
          <Box
            sx={{
              px: { xs: 2.2, md: 2.8 },
              py: 1.4,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: { xs: "flex-start", sm: "space-between" },
              gap: { xs: 1.2, sm: 1.5 },
              flexWrap: "wrap",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 0.7, sm: 1 }}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                {t("aiInsights.chart.assetLabel", "Asset")}
              </Typography>
              <FormControl
                size="small"
                sx={{
                  minWidth: { sm: 240 },
                  width: { xs: "100%", sm: 240 },
                  direction: "ltr",
                }}
              >
                <Select
                  value={assetId}
                  onChange={(e) =>
                    setAssetId(String(e.target.value || DEFAULT_INSTRUMENT_ID))
                  }
                  displayEmpty
                  renderValue={() => {
                    const current = instrument || chartInstruments[0];
                    if (!current) return t("aiInsights.chart.selectAsset", "Select asset");

                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <AssetIcon asset={current} size={18} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="span"
                            sx={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 1000,
                              lineHeight: 1.1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {current.label}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              display: "block",
                              fontSize: 10,
                              opacity: 0.7,
                              lineHeight: 1.1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatInstrumentPairLabel(current)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{
                    height: 32,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 900,
                    color: "rgba(255,255,255,0.92)",
                    backgroundColor: "rgba(58,198,255,0.12)",
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(58,198,255,0.30)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(58,198,255,0.45)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(58,198,255,0.60)",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "rgba(255,255,255,0.80)",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.10)",
                        backgroundColor: "rgba(10,16,32,0.96)",
                        backdropFilter: "blur(16px)",
                        color: "#fff",
                      },
                    },
                  }}
                >
                  {chartInstrumentGroups.map((group) => (
                    <React.Fragment key={group.key}>
                      <ListSubheader
                        disableSticky
                        sx={{
                          lineHeight: 1.6,
                          fontSize: 11,
                          fontWeight: 1000,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.58)",
                          backgroundColor: "transparent",
                          px: 2,
                          py: 0.8,
                        }}
                      >
                        {group.label}
                      </ListSubheader>
                      {group.items.map((a) => (
                        <MenuItem key={a.id} value={a.id} sx={{ fontSize: 12 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              gap: 1.2,
                            }}
                          >
                            <AssetIcon asset={a} size={20} />
                            <Typography sx={{ fontWeight: 1000, fontSize: 12 }}>
                              {a.label}
                            </Typography>
                            <Typography sx={{ opacity: 0.7, fontSize: 11 }}>
                              {a.base?.code}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Typography sx={{ opacity: 0.7, fontSize: 11 }}>
                              {formatInstrumentPairLabel(a)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </React.Fragment>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={timeframe}
              onChange={(e, v) => v && setTimeframe(v)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                backgroundColor: "rgba(3,10,25,0.55)",
                borderRadius: 999,
                p: 0.4,
                border: "1px solid rgba(255,255,255,0.10)",
                direction: "ltr",
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: 999,
                  px: { xs: 1.2, sm: 1.6 },
                  flex: { xs: 1, sm: "0 0 auto" },
                  minWidth: { xs: 0, sm: "auto" },
                  textTransform: "none",
                  fontWeight: 900,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.72)",
                  "&.Mui-selected": {
                    background:
                      "linear-gradient(135deg, rgba(35,166,232,0.28), rgba(77,196,255,0.18))",
                    color: "#fff",
                  },
                },
              }}
            >
              {TIMEFRAMES.map((t) => (
                <ToggleButton key={t.id} value={t.id}>
                  {t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Target analysis */}
          <Box
            sx={{
              px: { xs: 2.2, md: 2.8 },
              py: 1.3,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: { xs: 1.2, md: 1.6 },
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background:
                "radial-gradient(680px 180px at 50% 0%, rgba(251,191,36,0.10) 0%, rgba(0,0,0,0) 62%)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <FlagOutlinedIcon sx={{ color: "rgba(251,191,36,0.92)" }} />
              <Typography sx={{ fontWeight: 1000, fontSize: 13, letterSpacing: "-0.01em" }}>
                {t("aiInsights.targets.title", "Target Analysis")}
              </Typography>
              <Chip
                label={
                  targetMode
                    ? t("aiInsights.targets.modeOn", "Mode: ON")
                    : t("aiInsights.targets.modeOff", "Mode: OFF")
                }
                size="small"
                onClick={() =>
                  setTargetMode((v) => {
                    const next = !v;
                    if (!next) setPlacingTarget(null);
                    return next;
                  })
                }
                sx={{
                  height: 22,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.9)",
                  border: targetMode
                    ? "1px solid rgba(251,191,36,0.40)"
                    : "1px solid rgba(255,255,255,0.14)",
                  bgcolor: targetMode ? "rgba(251,191,36,0.12)" : "rgba(0,0,0,0.18)",
                }}
              />
              {targetMode && placingTarget ? (
                <Chip
                  label={
                    placingTarget === "target1"
                      ? t("aiInsights.targets.clickToPlace1", "Click chart to place Target 1")
                      : t("aiInsights.targets.clickToPlace2", "Click chart to place Target 2")
                  }
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 999,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    bgcolor: "rgba(0,0,0,0.20)",
                  }}
                />
              ) : null}
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.1}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ direction: "ltr" }}
            >
              <Button
                size="small"
                variant={placingTarget === "target1" ? "contained" : "outlined"}
                onClick={() => {
                  if (!targetMode) setTargetMode(true);
                  setPlacingTarget((v) => (v === "target1" ? null : "target1"));
                }}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  textTransform: "none",
                  fontSize: 11,
                  px: 1.6,
                  ...(placingTarget === "target1"
                    ? {
                        bgcolor: "rgba(251,191,36,0.92)",
                        color: "rgba(0,0,0,0.92)",
                        "&:hover": { bgcolor: "rgba(251,191,36,0.86)" },
                      }
                    : {
                        borderColor: "rgba(251,191,36,0.40)",
                        color: "rgba(251,191,36,0.92)",
                        "&:hover": { borderColor: "rgba(251,191,36,0.60)" },
                      }),
                }}
              >
                {t("aiInsights.targets.setTarget1", "Set T1")}
              </Button>

              <TextField
                size="small"
                type="number"
                value={target1 ?? ""}
                onChange={(e) => {
                  const v = String(e.target.value || "");
                  if (!v) setTarget1(null);
                  else setTarget1(roundToDigits(v, priceDigits));
                }}
                inputProps={{ step: 10 ** -priceDigits }}
                placeholder={t("aiInsights.targets.target1Placeholder", "Target 1")}
                sx={{
                  width: { xs: "100%", sm: 140 },
                  "& .MuiOutlinedInput-root": {
                    height: 34,
                    borderRadius: 999,
                    color: "rgba(255,255,255,0.92)",
                    bgcolor: "rgba(0,0,0,0.22)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(251,191,36,0.50)" },
                    "& input": { fontSize: 12, fontWeight: 900, px: 1.6 },
                  },
                }}
              />

              <Button
                size="small"
                variant={placingTarget === "target2" ? "contained" : "outlined"}
                onClick={() => {
                  if (!targetMode) setTargetMode(true);
                  setPlacingTarget((v) => (v === "target2" ? null : "target2"));
                }}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  textTransform: "none",
                  fontSize: 11,
                  px: 1.6,
                  ...(placingTarget === "target2"
                    ? {
                        bgcolor: "rgba(167,139,250,0.92)",
                        color: "rgba(0,0,0,0.92)",
                        "&:hover": { bgcolor: "rgba(167,139,250,0.86)" },
                      }
                    : {
                        borderColor: "rgba(167,139,250,0.42)",
                        color: "rgba(167,139,250,0.92)",
                        "&:hover": { borderColor: "rgba(167,139,250,0.62)" },
                      }),
                }}
              >
                {t("aiInsights.targets.setTarget2", "Set T2")}
              </Button>

              <TextField
                size="small"
                type="number"
                value={target2 ?? ""}
                onChange={(e) => {
                  const v = String(e.target.value || "");
                  if (!v) setTarget2(null);
                  else setTarget2(roundToDigits(v, priceDigits));
                }}
                inputProps={{ step: 10 ** -priceDigits }}
                placeholder={t("aiInsights.targets.target2Placeholder", "Target 2")}
                sx={{
                  width: { xs: "100%", sm: 140 },
                  "& .MuiOutlinedInput-root": {
                    height: 34,
                    borderRadius: 999,
                    color: "rgba(255,255,255,0.92)",
                    bgcolor: "rgba(0,0,0,0.22)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(167,139,250,0.55)" },
                    "& input": { fontSize: 12, fontWeight: 900, px: 1.6 },
                  },
                }}
              />

              <Button
                size="small"
                variant="contained"
                disabled={!canAnalyzeTargets}
                onClick={runTargetAnalysis}
                sx={{
                  borderRadius: 999,
                  fontWeight: 1000,
                  textTransform: "none",
                  fontSize: 11,
                  px: 1.8,
                  bgcolor: "rgba(57,198,255,0.92)",
                  color: "rgba(0,0,0,0.92)",
                  "&:hover": { bgcolor: "rgba(57,198,255,0.86)" },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.38)",
                  },
                }}
              >
                {t("aiInsights.targets.analyze", "Analyze Targets")}
              </Button>

              <Button
                size="small"
                variant="text"
                onClick={clearTargets}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  textTransform: "none",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.74)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                {t("aiInsights.targets.reset", "Reset")}
              </Button>
            </Stack>
          </Box>

          {/* Chart */}
          <MarketStatsBar
            asset={instrument}
            assetLabel={assetLabel}
            timeframe={tf}
            candles={candles}
            vsCurrency={vsCurrency}
            live
            loading={dataState.loading}
            error={dataState.error}
            lastUpdated={dataState.lastUpdated}
          />

          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                position: "relative",
                height: { xs: 340, md: 560 },
                backgroundImage:
                  "radial-gradient(900px 320px at 50% 0%, rgba(57,198,255,0.18) 0%, rgba(0,0,0,0) 62%), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "cover, 48px 48px, 48px 48px",
                backgroundPosition: "center, center, center",
              }}
            >
              <LightweightCandlesChart
                data={candles}
                locale={i18n.language}
                height="100%"
                selectedCandle={selectedCandle}
                onSelectCandle={setSelectedCandle}
                priceLines={targetLines}
                placingTarget={targetMode ? placingTarget : null}
                onPlaceTargetPrice={handlePlaceTarget}
              />

              {dataState.loading && !candles.length && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    px: 3,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.12)",
                      bgcolor: "rgba(0,0,0,0.38)",
                      backdropFilter: "blur(12px)",
                      px: 2,
                      py: 1.3,
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <Typography sx={{ opacity: 0.88, fontWeight: 900, fontSize: 13 }}>
                      {t("aiInsights.chart.loadingMarketData", "Loading market data...")}
                    </Typography>
                  </Box>
                </Box>
              )}

              {!dataState.loading && dataState.error && !candles.length && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    px: 3,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: 560,
                      borderRadius: 4,
                      border: "1px solid rgba(255,120,120,0.35)",
                      bgcolor: "rgba(0,0,0,0.42)",
                      backdropFilter: "blur(12px)",
                      px: 2,
                      py: 1.7,
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 1000, fontSize: 14 }}>
                      {dataState.errorCode === "NO_DATA"
                        ? t(
                            "aiInsights.chart.errors.noDataTitle",
                            "No data returned for this asset/timeframe.",
                          )
                        : dataState.errorCode === "RATE_LIMIT"
                          ? t(
                              "aiInsights.chart.errors.rateLimitTitle",
                              chartProvider === "currencyapi"
                                ? "Rate limited by CurrencyAPI."
                                : "Rate limited by CoinGecko.",
                            )
                          : dataState.errorCode === "TIMEOUT"
                            ? t("aiInsights.chart.errors.timeoutTitle", "Request timed out.")
                            : dataState.errorCode === "BLOCKED"
                              ? t("aiInsights.chart.errors.blockedTitle", "Request blocked.")
                              : t("aiInsights.chart.errors.genericTitle", "Unable to load chart data.")}
                    </Typography>
                    <Typography sx={{ mt: 0.6, opacity: 0.7, fontSize: 12 }}>
                      {dataState.error}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: isAr ? "auto" : 12,
                  right: isAr ? 12 : "auto",
                  pointerEvents: "none",
                }}
              >
                <Chip
                  label={statusChipLabel}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 999,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.85)",
                    border: dataState.error
                      ? "1px solid rgba(255,120,120,0.35)"
                      : "1px solid rgba(255,255,255,0.14)",
                    bgcolor: "rgba(0,0,0,0.26)",
                    backdropFilter: "blur(10px)",
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <SelectedPointAnalysisPanel
          candles={candles}
          selectedCandle={selectedCandle}
          assetLabel={assetLabel}
          timeframe={tf}
          vsCurrency={vsCurrency}
        />

        <MarketAnalysisPanel
          candles={candles}
          timeframe={tf}
          assetLabel={assetLabel}
          vsCurrency={vsCurrency}
          loading={dataState.loading}
          error={dataState.error}
          source={dataState.source}
        />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <AIChatPanel
          instrument={instrument}
          assetLabel={assetLabel}
          timeframeLabel={tf?.label}
          marketContext={marketContext}
        />
      </Box>

      <TargetAnalysisModal
        open={targetAnalysisOpen}
        onClose={() => setTargetAnalysisOpen(false)}
        candles={candles}
        assetLabel={assetLabel}
        timeframeLabel={tf?.label || tfLabel || timeframe}
        vsCurrency={vsCurrency}
        analysisResult={targetAnalysisResult}
        contextSnapshot={targetAnalysisContext}
      />
    </Box>
  );
}
