import * as React from "react";
import { Box, Card, Chip, Divider, Stack, Typography } from "@mui/material";
import PinDropOutlinedIcon from "@mui/icons-material/PinDropOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import { useTranslation } from "react-i18next";

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function stdev(nums) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function formatMoney(value, currency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";

  const c = typeof currency === "string" ? currency.toUpperCase() : "USD";
  const maximumFractionDigits = n >= 1000 ? 0 : n >= 1 ? 2 : 6;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits,
    }).format(n);
  } catch {
    return n.toFixed(Math.min(6, maximumFractionDigits));
  }
}

function formatPct(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function normalizeCandles(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((c) => ({
      time: Number(c?.time),
      open: Number(c?.open),
      high: Number(c?.high),
      low: Number(c?.low),
      close: Number(c?.close),
    }))
    .filter((c) => Number.isFinite(c.time) && [c.open, c.high, c.low, c.close].every(Number.isFinite))
    .sort((a, b) => a.time - b.time);
}

function computePointSignals(candles, selectedTime, { before = 12, after = 12 } = {}) {
  const arr = normalizeCandles(candles);
  const t = Number(selectedTime);
  if (!Number.isFinite(t) || !arr.length) return null;

  const idx = arr.findIndex((c) => c.time === t);
  if (idx < 0) return null;

  const start = Math.max(0, idx - before);
  const end = Math.min(arr.length - 1, idx + after);

  const windowCandles = arr.slice(start, end + 1);
  const beforeCandles = arr.slice(start, idx);
  const afterCandles = arr.slice(idx + 1, end + 1);

  const selected = arr[idx];

  let support = Infinity;
  let resistance = -Infinity;
  for (const c of windowCandles) {
    if (c.low < support) support = c.low;
    if (c.high > resistance) resistance = c.high;
  }

  const rangePct =
    selected.close > 0 && Number.isFinite(support) && Number.isFinite(resistance)
      ? ((resistance - support) / selected.close) * 100
      : null;

  const returnsPct = [];
  for (let i = start + 1; i <= end; i += 1) {
    const prev = arr[i - 1]?.close;
    const curr = arr[i]?.close;
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) continue;
    returnsPct.push(((curr - prev) / prev) * 100);
  }
  const volatilityStdevPct = stdev(returnsPct);

  const beforeTrendPct =
    beforeCandles.length && beforeCandles[0].close > 0
      ? ((selected.close - beforeCandles[0].close) / beforeCandles[0].close) * 100
      : null;

  const afterTrendPct =
    afterCandles.length && selected.close > 0
      ? ((afterCandles[afterCandles.length - 1].close - selected.close) / selected.close) *
        100
      : null;

  const momentumLookback = Math.min(4, idx - start);
  const momentumBase = momentumLookback > 0 ? arr[idx - momentumLookback]?.close : null;
  const momentumPct =
    momentumBase && Number.isFinite(momentumBase) && momentumBase > 0
      ? ((selected.close - momentumBase) / momentumBase) * 100
      : null;

  const risk =
    (Number.isFinite(volatilityStdevPct) && volatilityStdevPct >= 2.2) ||
    (Number.isFinite(rangePct) && rangePct >= 7.5)
      ? "High"
      : (Number.isFinite(volatilityStdevPct) && volatilityStdevPct >= 1.1) ||
          (Number.isFinite(rangePct) && rangePct >= 3.5)
        ? "Medium"
        : "Low";

  return {
    idx,
    window: { start, end, before, after, points: windowCandles.length },
    selected,
    support: Number.isFinite(support) ? support : null,
    resistance: Number.isFinite(resistance) ? resistance : null,
    rangePct,
    returnsPct,
    volatilityStdevPct,
    risk,
    beforeTrendPct,
    afterTrendPct,
    momentumPct,
    direction:
      Number.isFinite(beforeTrendPct) && beforeTrendPct > 0
        ? "Up"
        : Number.isFinite(beforeTrendPct) && beforeTrendPct < 0
          ? "Down"
          : "Flat",
  };
}

function localizeRisk(t, risk) {
  if (risk === "Low") return t("aiInsights.analysis.risk.low", "Low");
  if (risk === "Medium") return t("aiInsights.analysis.risk.medium", "Medium");
  if (risk === "High") return t("aiInsights.analysis.risk.high", "High");
  return typeof risk === "string" ? risk : "";
}

function Metric({ label, value, hint, accent = "rgba(57,198,255,0.32)" }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.20)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        px: 2,
        py: 1.7,
        minHeight: 92,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(520px 160px at 18% 12%, ${accent} 0%, rgba(0,0,0,0) 62%)`,
          pointerEvents: "none",
        }}
      />
      <Typography sx={{ position: "relative", opacity: 0.7, fontSize: 12 }}>
        {label}
      </Typography>
      <Typography sx={{ position: "relative", fontWeight: 1000, fontSize: 18, mt: 0.6 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography sx={{ position: "relative", opacity: 0.65, fontSize: 12, mt: 0.3 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function SelectedPointAnalysisPanel({
  candles,
  selectedCandle,
  assetLabel,
  timeframe,
  vsCurrency = "usd",
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const selectedTime = Number(selectedCandle?.time);
  const signals = React.useMemo(
    () => computePointSignals(candles, selectedTime),
    [candles, selectedTime],
  );

  const selected = signals?.selected;
  const hasSelection = Boolean(selected && Number.isFinite(selected.time));

  const tsLabel = hasSelection
    ? new Date(selected.time * 1000).toLocaleString(i18n.language || undefined)
    : null;

  const directionColor =
    signals?.direction === "Up"
      ? "#22c55e"
      : signals?.direction === "Down"
        ? "#ef4444"
        : "rgba(255,255,255,0.78)";
  const DirectionIcon =
    signals?.direction === "Up"
      ? TrendingUpOutlinedIcon
      : signals?.direction === "Down"
        ? TrendingDownOutlinedIcon
        : null;

  return (
    <Card
      sx={{
        mt: 2.2,
        borderRadius: 5,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Box
        sx={{
          px: { xs: 2.2, md: 2.8 },
          py: 2.1,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 1.4,
          flexWrap: "wrap",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PinDropOutlinedIcon sx={{ color: "#39c6ff" }} />
          <Box>
            <Typography sx={{ fontWeight: 1000, fontSize: 16, letterSpacing: "-0.01em" }}>
              {t("aiInsights.point.title", "Point-in-time Analysis")}
            </Typography>
            <Typography sx={{ mt: 0.3, opacity: 0.7, fontSize: 12 }}>
              {t(
                "aiInsights.point.subtitle",
                "Click a candle to inspect the exact market state at that moment.",
              )}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ direction: "ltr" }}>
          <Chip
            label={assetLabel || t("common.asset", "Asset")}
            size="small"
            sx={{
              height: 22,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              color: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(58,198,255,0.30)",
              bgcolor: "rgba(58,198,255,0.12)",
            }}
          />
          <Chip
            label={
              timeframe?.label
                ? t("aiInsights.stats.timeframeLabel", {
                    defaultValue: "TF: {{label}}",
                    label: timeframe.label,
                  })
                : t("aiInsights.point.timeframeFallback", "Timeframe")
            }
            size="small"
            sx={{
              height: 22,
              borderRadius: 999,
              fontSize: 11,
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.14)",
              bgcolor: "rgba(0,0,0,0.22)",
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2.2, md: 2.8 }, py: { xs: 2.2, md: 2.6 } }}>
        {!hasSelection ? (
          <Box
            sx={{
              borderRadius: 4,
              border: "1px dashed rgba(255,255,255,0.18)",
              bgcolor: "rgba(255,255,255,0.04)",
              px: 2,
              py: 2,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
              {t("aiInsights.point.emptyTitle", "No point selected yet.")}
            </Typography>
            <Typography sx={{ mt: 0.6, opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}>
              {t(
                "aiInsights.point.emptyBody",
                "Click a candlestick on the chart to see a focused breakdown (trend, momentum, volatility, and nearby levels).",
              )}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.1}>
            <Box
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.10)",
                bgcolor: "rgba(0,0,0,0.18)",
                px: 2,
                py: 1.7,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.6}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                sx={{ direction: isAr ? "rtl" : "ltr" }}
              >
                <Box>
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    {t("aiInsights.point.selectedTimestamp", "Selected timestamp")}
                  </Typography>
                  <Typography sx={{ fontWeight: 1000, fontSize: 14, mt: 0.4 }}>
                    {tsLabel}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ direction: "ltr" }}>
                  {DirectionIcon ? <DirectionIcon sx={{ color: directionColor }} /> : null}
                  <Typography sx={{ fontWeight: 1000, color: directionColor }}>
                    {signals.direction === "Up"
                      ? t("aiInsights.point.localTrendUp", "Local trend: Up")
                      : signals.direction === "Down"
                        ? t("aiInsights.point.localTrendDown", "Local trend: Down")
                        : t("aiInsights.point.localTrendFlat", "Local trend: Flat")}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 1.6,
              }}
            >
              <Metric
                label={t("aiInsights.point.metrics.ohlc", "OHLC")}
                value={`${formatMoney(selected.open, vsCurrency)} / ${formatMoney(
                  selected.close,
                  vsCurrency,
                )}`}
                hint={t("aiInsights.point.metrics.ohlcHint", {
                  defaultValue: "High {{high}} · Low {{low}}",
                  high: formatMoney(selected.high, vsCurrency),
                  low: formatMoney(selected.low, vsCurrency),
                })}
                accent="rgba(57,198,255,0.30)"
              />

              <Metric
                label={t("aiInsights.point.metrics.momentum", "Momentum")}
                value={formatPct(signals.momentumPct, 2)}
                hint={t("aiInsights.point.metrics.momentumHint", "Short lookback into the selected bar")}
                accent="rgba(123,92,255,0.28)"
              />

              <Metric
                label={t("aiInsights.point.metrics.volatility", "Volatility")}
                value={
                  Number.isFinite(Number(signals.volatilityStdevPct))
                    ? `${signals.volatilityStdevPct.toFixed(2)}%`
                    : "--"
                }
                hint={t("aiInsights.point.metrics.volatilityHint", "Std dev of local returns")}
                accent="rgba(255,255,255,0.16)"
              />

              <Metric
                label={t("aiInsights.point.metrics.trendBefore", "Trend (before)")}
                value={formatPct(signals.beforeTrendPct, 2)}
                hint={t("aiInsights.point.metrics.windowBars", {
                  defaultValue: "Window: {{count}} bars",
                  count: signals.window.before,
                })}
                accent="rgba(34,197,94,0.16)"
              />

              <Metric
                label={t("aiInsights.point.metrics.trendAfter", "Trend (after)")}
                value={signals.afterTrendPct == null ? "--" : formatPct(signals.afterTrendPct, 2)}
                hint={
                  signals.afterTrendPct == null
                    ? t("aiInsights.point.metrics.notEnoughFuture", "Not enough future bars")
                    : t("aiInsights.point.metrics.windowBars", {
                        defaultValue: "Window: {{count}} bars",
                        count: signals.window.after,
                      })
                }
                accent="rgba(239,68,68,0.16)"
              />

              <Metric
                label={t("aiInsights.point.metrics.riskEstimate", "Risk estimate")}
                value={localizeRisk(t, signals.risk) || signals.risk}
                hint={
                  Number.isFinite(Number(signals.rangePct))
                    ? t("aiInsights.point.metrics.localRange", {
                        defaultValue: "Local range: {{value}}%",
                        value: signals.rangePct.toFixed(2),
                      })
                    : t("aiInsights.point.metrics.localRangeEmpty", "Local range: --")
                }
                accent={
                  signals.risk === "High"
                    ? "rgba(239,68,68,0.18)"
                    : signals.risk === "Medium"
                      ? "rgba(245,158,11,0.18)"
                      : "rgba(34,197,94,0.18)"
                }
              />
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.6,
              }}
            >
              <Metric
                label={t("aiInsights.point.metrics.supportLocal", "Support (local)")}
                value={formatMoney(signals.support, vsCurrency)}
                hint={
                  signals.support && selected.close
                    ? t("aiInsights.point.metrics.distance", {
                        defaultValue: "Distance: {{value}}",
                        value: formatPct(((selected.close - signals.support) / selected.close) * 100, 2),
                      })
                    : null
                }
                accent="rgba(34,197,94,0.16)"
              />
              <Metric
                label={t("aiInsights.point.metrics.resistanceLocal", "Resistance (local)")}
                value={formatMoney(signals.resistance, vsCurrency)}
                hint={
                  signals.resistance && selected.close
                    ? t("aiInsights.point.metrics.distance", {
                        defaultValue: "Distance: {{value}}",
                        value: formatPct(((signals.resistance - selected.close) / selected.close) * 100, 2),
                      })
                    : null
                }
                accent="rgba(239,68,68,0.16)"
              />
            </Box>
          </Stack>
        )}
      </Box>
    </Card>
  );
}
