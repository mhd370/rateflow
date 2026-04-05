import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";

function sanitizeCandles(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  const byTime = new Map();

  for (const c of arr) {
    if (!c) continue;

    let time = Number(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);

    // Lightweight Charts expects UNIX time in seconds.
    if (!Number.isFinite(time)) continue;
    if (time > 100000000000) time = Math.floor(time / 1000); // looks like ms
    time = Math.floor(time);

    if (![open, high, low, close].every(Number.isFinite)) continue;

    const fixedHigh = Math.max(high, open, close);
    const fixedLow = Math.min(low, open, close);

    byTime.set(time, { time, open, high: fixedHigh, low: fixedLow, close });
  }

  for (const c of byTime.values()) out.push(c);
  out.sort((a, b) => a.time - b.time);
  return out;
}

function debugLog(...args) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

function normalizeChartTimeToUnixSeconds(time) {
  if (typeof time === "number" && Number.isFinite(time)) return Math.floor(time);
  if (!time || typeof time !== "object") return null;

  // BusinessDay-like object: { year, month, day }
  const year = Number(time.year);
  const month = Number(time.month);
  const day = Number(time.day);
  if (![year, month, day].every(Number.isFinite)) return null;

  const ms = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return Math.floor(ms / 1000);
}

function findNearestCandle(candles, targetTime) {
  const arr = Array.isArray(candles) ? candles : [];
  if (!arr.length || !Number.isFinite(targetTime)) return null;

  // Data is sorted; do a simple binary search for the closest index.
  let lo = 0;
  let hi = arr.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = Number(arr[mid]?.time);
    if (!Number.isFinite(t)) break;
    if (t === targetTime) return arr[mid];
    if (t < targetTime) lo = mid + 1;
    else hi = mid - 1;
  }

  const i1 = Math.min(arr.length - 1, Math.max(0, lo));
  const i0 = Math.min(arr.length - 1, Math.max(0, lo - 1));

  const c0 = arr[i0];
  const c1 = arr[i1];
  if (!c0) return c1 || null;
  if (!c1) return c0 || null;

  const d0 = Math.abs(Number(c0.time) - targetTime);
  const d1 = Math.abs(Number(c1.time) - targetTime);
  return d1 < d0 ? c1 : c0;
}

export default function LightweightCandlesChart({
  data,
  height = { xs: 320, md: 520 },
  locale,
  selectedCandle,
  onSelectCandle,
  priceLines = [],
  trendlines = [],
  placingTarget,
  onPlaceTargetPrice,
}) {
  const { t } = useTranslation();
  const containerRef = React.useRef(null);
  const chartRef = React.useRef(null);
  const seriesRef = React.useRef(null);
  const markersRef = React.useRef(null);
  const priceLinesRef = React.useRef(new Map());
  const trendSeriesRef = React.useRef(new Map());
  const dataRef = React.useRef(data);
  const prevDataRef = React.useRef([]);
  const localeRef = React.useRef(locale);
  const onSelectRef = React.useRef(onSelectCandle);
  const placingTargetRef = React.useRef(placingTarget);
  const onPlaceTargetRef = React.useRef(onPlaceTargetPrice);

  const [status, setStatus] = React.useState({ state: "loading", message: "" });
  const [initAttempt, setInitAttempt] = React.useState(0);
  const retryCountRef = React.useRef(0);
  const dimRetryCountRef = React.useRef(0);
  const retryTimerRef = React.useRef(null);

  const sanitizedData = React.useMemo(() => sanitizeCandles(data), [data]);
  const hasData = sanitizedData.length > 0;
  const selectedTime = React.useMemo(() => {
    const t = Number(selectedCandle?.time);
    return Number.isFinite(t) ? Math.floor(t) : null;
  }, [selectedCandle]);

  React.useEffect(() => {
    onSelectRef.current = onSelectCandle;
  }, [onSelectCandle]);

  React.useEffect(() => {
    placingTargetRef.current = placingTarget;
  }, [placingTarget]);

  React.useEffect(() => {
    onPlaceTargetRef.current = onPlaceTargetPrice;
  }, [onPlaceTargetPrice]);

  React.useEffect(() => {
    dataRef.current = sanitizedData;

    const series = seriesRef.current;
    const chart = chartRef.current;

    if (!series || !chart) {
      debugLog("[AI Insights][Chart] setData skipped (chart/series missing)", {
        hasChart: Boolean(chart),
        hasSeries: Boolean(series),
        len: sanitizedData.length,
      });
      prevDataRef.current = sanitizedData;
      return;
    }

    try {
      const prev = Array.isArray(prevDataRef.current) ? prevDataRef.current : [];
      const next = sanitizedData;

      const prevLast = prev.length ? prev[prev.length - 1] : null;
      const nextLast = next.length ? next[next.length - 1] : null;
      const sameLen = prev.length === next.length;
      const canUpdateLast =
        prevLast &&
        nextLast &&
        sameLen &&
        Number(prevLast.time) === Number(nextLast.time);
      const canAppend =
        prevLast &&
        nextLast &&
        next.length === prev.length + 1 &&
        Number(prevLast.time) < Number(nextLast.time);

      if (!next.length) {
        series.setData([]);
      } else if (canUpdateLast) {
        const stickToRight = chart.timeScale().scrollPosition() <= 2;
        series.update(nextLast);
        if (stickToRight) chart.timeScale().scrollToRealTime();
      } else if (canAppend) {
        const stickToRight = chart.timeScale().scrollPosition() <= 2;
        series.update(nextLast);
        if (stickToRight) chart.timeScale().scrollToRealTime();
      } else {
        series.setData(next);
        chart.timeScale().fitContent();
        chart.priceScale("right").applyOptions({ autoScale: true });
        if (
          typeof window !== "undefined" &&
          typeof window.requestAnimationFrame === "function"
        ) {
          window.requestAnimationFrame(() => {
            if (chartRef.current !== chart) return;
            chart.timeScale().fitContent();
          });
        }
      }
    } catch (err) {
      console.error("[AI Insights][Chart] series.setData failed:", err, {
        len: sanitizedData.length,
        first: sanitizedData[0],
      });
    } finally {
      prevDataRef.current = sanitizedData;
    }
  }, [sanitizedData]);

  React.useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const desired = Array.isArray(priceLines)
      ? priceLines
          .filter((l) => l && typeof l.key === "string" && Number.isFinite(Number(l.price)))
          .map((l) => ({
            key: String(l.key),
            price: Number(l.price),
            title: typeof l.title === "string" ? l.title : "",
            color: typeof l.color === "string" ? l.color : "rgba(255,255,255,0.65)",
            lineWidth: Number.isFinite(Number(l.lineWidth)) ? Number(l.lineWidth) : 2,
            lineStyle:
              typeof l.lineStyle === "number" ? l.lineStyle : LineStyle.Dashed,
            axisLabelVisible: l.axisLabelVisible !== false,
          }))
      : [];

    const map = priceLinesRef.current;
    const desiredKeys = new Set(desired.map((d) => d.key));

    for (const [key, line] of map.entries()) {
      if (!desiredKeys.has(key)) {
        try {
          series.removePriceLine(line);
        } catch {
          // ignore
        }
        map.delete(key);
      }
    }

    for (const def of desired) {
      const existing = map.get(def.key);
      const options = {
        price: def.price,
        color: def.color,
        lineWidth: def.lineWidth,
        lineStyle: def.lineStyle,
        axisLabelVisible: def.axisLabelVisible,
        title: def.title,
      };

      if (existing) {
        try {
          existing.applyOptions(options);
        } catch {
          // ignore
        }
      } else {
        try {
          const line = series.createPriceLine(options);
          map.set(def.key, line);
        } catch (err) {
          console.error("[AI Insights][Chart] createPriceLine failed:", err, options);
        }
      }
    }
  }, [priceLines, status.state]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const desired = Array.isArray(trendlines)
      ? trendlines
          .filter((l) => l && typeof l.key === "string" && Array.isArray(l.points))
          .map((l) => ({
            key: String(l.key),
            color: typeof l.color === "string" ? l.color : "rgba(255,255,255,0.55)",
            width: Number.isFinite(Number(l.width)) ? Number(l.width) : 2,
            lineStyle: typeof l.lineStyle === "number" ? l.lineStyle : LineStyle.Solid,
            points: l.points
              .map((p) => ({
                time: Math.floor(Number(p?.time)),
                value: Number(p?.value),
              }))
              .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value)),
          }))
          .filter((l) => l.points.length >= 2)
      : [];

    const map = trendSeriesRef.current;
    const desiredKeys = new Set(desired.map((d) => d.key));

    for (const [key, series] of map.entries()) {
      if (!desiredKeys.has(key)) {
        try {
          chart.removeSeries(series);
        } catch {
          // ignore
        }
        map.delete(key);
      }
    }

    for (const def of desired) {
      const existing = map.get(def.key);
      if (existing) {
        try {
          existing.applyOptions({
            color: def.color,
            lineWidth: def.width,
            lineStyle: def.lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          existing.setData(def.points);
        } catch (err) {
          console.error("[AI Insights][Chart] trendline update failed:", err, def.key);
        }
      } else {
        try {
          const lineSeries = chart.addSeries(LineSeries, {
            color: def.color,
            lineWidth: def.width,
            lineStyle: def.lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          lineSeries.setData(def.points);
          map.set(def.key, lineSeries);
        } catch (err) {
          console.error("[AI Insights][Chart] trendline create failed:", err, def.key);
        }
      }
    }
  }, [trendlines, status.state]);

  React.useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;

    if (!selectedTime) {
      markers.setMarkers([]);
      return;
    }

    markers.setMarkers([
      {
        time: selectedTime,
        position: "aboveBar",
        shape: "circle",
        color: "rgba(57,198,255,0.95)",
        text: "",
      },
    ]);
  }, [selectedTime]);

  React.useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!hasData) return;
    if (chartRef.current) return;
    if (status.state !== "error") return;
    if (retryCountRef.current >= 3) return;

    retryCountRef.current += 1;
    setStatus({ state: "loading", message: "" });
    setInitAttempt((n) => n + 1);
  }, [hasData, status.state]);

  React.useEffect(() => {
    localeRef.current = locale;
    const chart = chartRef.current;
    if (!chart) return;

    chart.applyOptions({
      localization: locale ? { locale } : undefined,
    });
  }, [locale]);

  React.useEffect(() => {
    let cancelled = false;
    let chart;
    let clickHandler;

    function init() {
      try {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;

        const container = containerRef.current;
        if (!container) return;

        const w = container.clientWidth;
        const h = container.clientHeight;
        debugLog("[AI Insights][Chart] container size:", { w, h });

        if ((w <= 0 || h <= 0) && dimRetryCountRef.current < 20) {
          dimRetryCountRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) setInitAttempt((n) => n + 1);
          }, 150);
          return;
        }

        chart = createChart(container, {
          autoSize: true,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "rgba(255,255,255,0.72)",
            fontFamily:
              "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            fontSize: 12,
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.06)" },
            horzLines: { color: "rgba(255,255,255,0.06)" },
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.12)",
            scaleMargins: { top: 0.12, bottom: 0.18 },
          },
          timeScale: {
            borderColor: "rgba(255,255,255,0.12)",
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: {
            mode: CrosshairMode.Magnet,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
          localization: localeRef.current
            ? { locale: localeRef.current }
            : undefined,
        });

        // lightweight-charts v5 uses chart.addSeries(SeriesDefinition, options)
        const series = chart.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "rgba(34,197,94,0.9)",
          wickDownColor: "rgba(239,68,68,0.9)",
        });

        chartRef.current = chart;
        seriesRef.current = series;
        markersRef.current = createSeriesMarkers(series, [], { zOrder: "top" });

        clickHandler = (param) => {
          const placing = placingTargetRef.current;
          const onPlace = onPlaceTargetRef.current;
          const seriesNow = seriesRef.current;

          if (placing && typeof onPlace === "function" && seriesNow && param?.point) {
            const price = seriesNow.coordinateToPrice(param.point.y);
            if (price == null) return;
            const numeric = typeof price === "number" ? price : Number(price);
            if (Number.isFinite(numeric)) onPlace(numeric);
            return;
          }

          const onSelect = onSelectRef.current;
          if (!onSelect) return;

          const clickedTime = normalizeChartTimeToUnixSeconds(param?.time);
          if (!clickedTime) return;

          const nearest = findNearestCandle(dataRef.current, clickedTime);
          if (nearest) onSelect(nearest);
        };

        chart.subscribeClick(clickHandler);

        const initial = sanitizeCandles(dataRef.current);
        const initialLast = initial.length ? initial[initial.length - 1] : null;
        try {
          series.setData(initial);
          chart.timeScale().fitContent();
          chart.priceScale("right").applyOptions({ autoScale: true });
          if (
            typeof window !== "undefined" &&
            typeof window.requestAnimationFrame === "function"
          ) {
            window.requestAnimationFrame(() => {
              if (cancelled) return;
              if (chartRef.current !== chart) return;
              chart.timeScale().fitContent();
            });
          }
        } catch (err) {
          console.error("[AI Insights][Chart] init setData failed:", err, {
            len: initial.length,
            first: initial[0],
            last: initialLast,
          });
          throw err;
        }

        if (cancelled) {
          chart.unsubscribeClick(clickHandler);
          chart.remove();
          return;
        }

        retryCountRef.current = 0;
        dimRetryCountRef.current = 0;
        setStatus({ state: "ready", message: "" });
      } catch (err) {
        if (cancelled) return;
        console.error("[AI Insights][Chart] Lightweight chart init failed:", err);

        const dataNow = Array.isArray(dataRef.current) ? dataRef.current : [];
        const hasDataNow = dataNow.length > 0;

        if (hasDataNow && retryCountRef.current < 3) {
          retryCountRef.current += 1;
          setStatus({ state: "loading", message: "" });
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) setInitAttempt((n) => n + 1);
          }, 650);
          return;
        }

        setStatus({ state: "error", message: "" });
      }
    }

    init();

    return () => {
      cancelled = true;
      if (chart && clickHandler) {
        try {
          chart.unsubscribeClick(clickHandler);
        } catch {
          // ignore
        }
      }
      markersRef.current?.detach?.();
      markersRef.current = null;
      seriesRef.current = null;
      chartRef.current = null;
      priceLinesRef.current = new Map();
      trendSeriesRef.current = new Map();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      if (chart) chart.remove();
    };
  }, [initAttempt]);

  return (
    <Box sx={{ position: "relative", height }}>
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />

      {status.state !== "ready" && !hasData && (
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
          <Typography sx={{ opacity: 0.75, fontWeight: 800, fontSize: 13 }}>
            {status.state === "error"
              ? t("aiInsights.chart.failedToLoad", "Chart failed to load.")
              : t("aiInsights.chart.loadingChart", "Loading chart...")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
