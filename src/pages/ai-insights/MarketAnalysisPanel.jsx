import * as React from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingFlatOutlinedIcon from "@mui/icons-material/TrendingFlatOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useTranslation } from "react-i18next";

import { analyzeMarketCandles } from "./analysisEngine";

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
  } catch (err) {
    return n.toFixed(Math.min(6, maximumFractionDigits));
  }
}

function formatPct(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function directionMeta(direction) {
  if (direction === "Bullish") {
    return {
      icon: TrendingUpOutlinedIcon,
      accent: "#22c55e",
      chipBg: "rgba(34,197,94,0.14)",
      chipBorder: "rgba(34,197,94,0.35)",
    };
  }

  if (direction === "Bearish") {
    return {
      icon: TrendingDownOutlinedIcon,
      accent: "#ef4444",
      chipBg: "rgba(239,68,68,0.14)",
      chipBorder: "rgba(239,68,68,0.35)",
    };
  }

  return {
    icon: TrendingFlatOutlinedIcon,
    accent: "rgba(255,255,255,0.82)",
    chipBg: "rgba(255,255,255,0.10)",
    chipBorder: "rgba(255,255,255,0.18)",
  };
}

function riskMeta(risk) {
  if (risk === "Low") {
    return { accent: "#22c55e", bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.30)" };
  }
  if (risk === "High") {
    return { accent: "#ef4444", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.30)" };
  }
  return { accent: "#f59e0b", bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.30)" };
}

function localizeDirection(t, direction) {
  if (direction === "Bullish") return t("aiInsights.analysis.direction.bullish", "Bullish");
  if (direction === "Bearish") return t("aiInsights.analysis.direction.bearish", "Bearish");
  if (direction === "Neutral") return t("aiInsights.analysis.direction.neutral", "Neutral");
  return typeof direction === "string" ? direction : "";
}

function localizeRisk(t, risk) {
  if (risk === "Low") return t("aiInsights.analysis.risk.low", "Low");
  if (risk === "Medium") return t("aiInsights.analysis.risk.medium", "Medium");
  if (risk === "High") return t("aiInsights.analysis.risk.high", "High");
  return typeof risk === "string" ? risk : "";
}

function MetricCard({ label, value, subtitle, accent = "#39c6ff", children }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.20)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        px: { xs: 1.8, md: 2 },
        py: { xs: 1.7, md: 1.9 },
        minHeight: { xs: 92, md: 96 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(520px 140px at 18% 12%, ${accent}22 0%, rgba(0,0,0,0) 60%)`,
          pointerEvents: "none",
        }}
      />
      <Typography sx={{ color: "rgba(255,255,255,0.70)", fontSize: 12, position: "relative" }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#fff", fontWeight: 1000, fontSize: 20, mt: 0.6, position: "relative" }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.68, position: "relative" }}>
          {subtitle}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

export default function MarketAnalysisPanel({
  candles,
  timeframe,
  assetLabel,
  vsCurrency = "usd",
  loading,
  error,
  source,
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const analysis = React.useMemo(
    () =>
      analyzeMarketCandles({
        candles,
        timeframeDays: timeframe?.days,
      }),
    [candles, timeframe?.days],
  );

  const dirMeta = directionMeta(analysis.direction);
  const risk = riskMeta(analysis.risk);
  const DirectionIcon = dirMeta.icon;
  const directionLabel = localizeDirection(t, analysis.direction) || analysis.direction;
  const riskLabel = localizeRisk(t, analysis.risk) || analysis.risk;
  const points = Number(analysis.signals?.points || 0);
  const tfDays = Number(analysis.signals?.timeframeDays || timeframe?.days || 30);

  const trendText = formatPct(analysis.signals?.overallChangePct);
  const momentumText = formatPct(analysis.signals?.momentumChangePct);
  const rangePct = Number(analysis.signals?.rangePct);
  const rangeText = Number.isFinite(rangePct) ? rangePct.toFixed(2) : "--";

  const supportText = formatMoney(analysis.signals?.support, vsCurrency);
  const resistanceText = formatMoney(analysis.signals?.resistance, vsCurrency);

  const explanationText =
    points < 8
      ? t(
          "aiInsights.analysis.notEnoughData",
          "Not enough market data points to compute a stable directional reading yet.",
        )
      : t("aiInsights.analysis.explanationText", {
          defaultValue:
            "Rule-based read from recent price action over ~{{days}} day(s): {{direction}} bias with {{confidence}}% confidence. Trend: {{trend}}; momentum: {{momentum}}; range volatility: {{range}}%. This is directional analysis, not a prediction.",
          days: tfDays,
          direction: directionLabel,
          confidence: analysis.confidence,
          trend: trendText,
          momentum: momentumText,
          range: rangeText,
        });

  const scenarioBase =
    points < 8
      ? t("aiInsights.analysis.scenarios.waitMore", "Wait for more data to build a reliable short-term read.")
      : analysis.direction === "Neutral"
        ? t("aiInsights.analysis.scenarios.baseNeutral", {
            defaultValue:
              "Base case: consolidation continues between recent support and resistance while momentum stays mixed.",
          })
        : analysis.direction === "Bullish"
          ? t("aiInsights.analysis.scenarios.baseBullish", {
              defaultValue:
                "Base case: bullish bias persists, but expect pullbacks as price retests recent levels.",
            })
          : t("aiInsights.analysis.scenarios.baseBearish", {
              defaultValue:
                "Base case: bearish bias persists, but short squeezes/pullbacks can occur near support.",
            });

  const scenarioBull =
    points < 8
      ? "—"
      : t("aiInsights.analysis.scenarios.bullText", {
          defaultValue:
            "Bull case: a sustained break above the recent swing high (resistance) could signal continuation. (Directional read, not a guaranteed forecast.)",
          resistance: resistanceText,
        });

  const scenarioBear =
    points < 8
      ? "—"
      : t("aiInsights.analysis.scenarios.bearText", {
          defaultValue:
            "Bear case: a sustained break below the recent swing low (support) could open further downside. (Directional read, not a guaranteed forecast.)",
          support: supportText,
        });

  const showSkeleton = Boolean(loading && (!candles || !candles.length));
  const showError = Boolean(error && (!candles || !candles.length));

  return (
    <Card
      sx={{
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
          <InsightsOutlinedIcon sx={{ color: "#7b5cff" }} />
          <Box>
            <Typography sx={{ fontWeight: 1000, fontSize: 16, letterSpacing: "-0.01em" }}>
              {t("aiInsights.analysis.title", "Smart Market Analysis")}
            </Typography>
            <Typography sx={{ mt: 0.3, opacity: 0.7, fontSize: 12 }}>
              {t(
                "aiInsights.analysis.subtitle",
                "Rule-based directional read from recent market behavior (not a prediction).",
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
          <Chip
            label={
              source === "coingecko-derived"
                ? t("aiInsights.analysis.sourceDerived", "CoinGecko • Derived")
                : t("aiInsights.analysis.sourceOhlc", "CoinGecko • OHLC")
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
        {showError ? (
          <Box
            sx={{
              borderRadius: 4,
              border: "1px solid rgba(255,120,120,0.35)",
              bgcolor: "rgba(255,0,0,0.06)",
              px: 2,
              py: 1.7,
            }}
          >
            <Typography sx={{ fontWeight: 1000, fontSize: 14 }}>
              {t("aiInsights.analysis.errorTitle", "Market analysis unavailable.")}
            </Typography>
            <Typography sx={{ mt: 0.6, opacity: 0.7, fontSize: 12 }}>
              {String(error)}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1.6,
              }}
            >
              <MetricCard
                label={t("aiInsights.analysis.metrics.direction", "Direction")}
                value={showSkeleton ? <Skeleton width={110} /> : directionLabel}
                accent={dirMeta.accent}
              >
                {!showSkeleton ? (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      icon={<DirectionIcon sx={{ fontSize: 16, color: dirMeta.accent }} />}
                      label={t("aiInsights.analysis.metrics.directionalRead", "Directional read")}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: 999,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.86)",
                        bgcolor: dirMeta.chipBg,
                        border: `1px solid ${dirMeta.chipBorder}`,
                      }}
                    />
                  </Box>
                ) : null}
              </MetricCard>

              <MetricCard
                label={t("aiInsights.analysis.metrics.confidence", "Confidence")}
                value={showSkeleton ? <Skeleton width={90} /> : `${analysis.confidence}%`}
                subtitle={
                  showSkeleton
                    ? null
                    : t(
                        "aiInsights.analysis.metrics.confidenceHint",
                        "Higher confidence means the recent signals are more consistent.",
                      )
                }
                accent="#39c6ff"
              >
                {!showSkeleton ? (
                  <Box sx={{ mt: 1.3 }}>
                    <LinearProgress
                      variant="determinate"
                      value={clamp(Number(analysis.confidence), 0, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: "rgba(255,255,255,0.10)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, rgba(57,198,255,0.95), rgba(123,92,255,0.85))",
                        },
                      }}
                    />
                  </Box>
                ) : null}
              </MetricCard>

              <MetricCard
                label={t("aiInsights.analysis.metrics.riskLevel", "Risk Level")}
                value={showSkeleton ? <Skeleton width={90} /> : riskLabel}
                accent={risk.accent}
              >
                {!showSkeleton ? (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      icon={<ShieldOutlinedIcon sx={{ fontSize: 16, color: risk.accent }} />}
                      label={riskLabel}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: 999,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.88)",
                        bgcolor: risk.bg,
                        border: `1px solid ${risk.border}`,
                      }}
                    />
                  </Box>
                ) : null}
              </MetricCard>
            </Box>

            <Divider sx={{ my: 2.1, borderColor: "rgba(255,255,255,0.10)" }} />

            {/* Signals */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.6 }}>
              {showSkeleton ? (
                <>
                  <Skeleton variant="rounded" width={120} height={26} />
                  <Skeleton variant="rounded" width={120} height={26} />
                  <Skeleton variant="rounded" width={120} height={26} />
                </>
              ) : (
                <>
                  <Chip
                    label={t("aiInsights.analysis.signals.last", {
                      defaultValue: "Last: {{value}}",
                      value: formatMoney(analysis.signals.lastClose, vsCurrency),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.trend", {
                      defaultValue: "Trend: {{value}}",
                      value: formatPct(analysis.signals.overallChangePct),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.momentum", {
                      defaultValue: "Momentum: {{value}}",
                      value: formatPct(analysis.signals.momentumChangePct),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.range", {
                      defaultValue: "Range: {{value}}%",
                      value: Number(analysis.signals.rangePct || 0).toFixed(2),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.maxDd", {
                      defaultValue: "Max DD: {{value}}%",
                      value: Number(analysis.signals.maxDrawdownPct || 0).toFixed(2),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.support", {
                      defaultValue: "Support: {{value}}",
                      value: formatMoney(analysis.signals.support, vsCurrency),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                  <Chip
                    label={t("aiInsights.analysis.signals.resistance", {
                      defaultValue: "Resistance: {{value}}",
                      value: formatMoney(analysis.signals.resistance, vsCurrency),
                    })}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.86)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.22)",
                    }}
                  />
                </>
              )}
            </Stack>

            {/* Explanation */}
            <Box
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.10)",
                backgroundColor: "rgba(0,0,0,0.20)",
                backdropFilter: "blur(12px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                px: { xs: 1.8, md: 2 },
                py: { xs: 1.6, md: 1.8 },
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.70)", fontSize: 12 }}>
                {t("aiInsights.analysis.explanationLabel", "Explanation")}
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14, mt: 0.7 }}>
                {showSkeleton ? <Skeleton /> : explanationText}
              </Typography>
            </Box>

            {/* Scenarios */}
            <Divider sx={{ my: 2.1, borderColor: "rgba(255,255,255,0.10)" }} />

            <Typography sx={{ fontWeight: 1000, fontSize: 14, mb: 1.2 }}>
              {t("aiInsights.analysis.scenarioTitle", "Scenario Summary")}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.6,
              }}
            >
              {[
                {
                  label: t("aiInsights.analysis.scenarios.base", "Base"),
                  text: scenarioBase,
                  accent: "rgba(255,255,255,0.82)",
                },
                { label: t("aiInsights.analysis.scenarios.bull", "Bull"), text: scenarioBull, accent: "#22c55e" },
                { label: t("aiInsights.analysis.scenarios.bear", "Bear"), text: scenarioBear, accent: "#ef4444" },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(0,0,0,0.20)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                    px: { xs: 1.8, md: 2 },
                    py: { xs: 1.6, md: 1.8 },
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(520px 160px at 22% 0%, ${s.accent}1f 0%, rgba(0,0,0,0) 60%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <Typography sx={{ fontSize: 12, opacity: 0.7, position: "relative" }}>
                    {t("aiInsights.analysis.scenarios.label", {
                      defaultValue: "{{label}} scenario",
                      label: s.label,
                    })}
                  </Typography>
                  <Typography sx={{ mt: 0.7, fontSize: 13, lineHeight: 1.55, position: "relative" }}>
                    {showSkeleton ? <Skeleton /> : s.text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography sx={{ mt: 1.8, fontSize: 11, opacity: 0.62 }}>
              {t(
                "aiInsights.analysis.educationalNote",
                "Educational note: this is a deterministic, rule-based read of recent market behavior, not financial advice.",
              )}
            </Typography>
          </>
        )}
      </Box>
    </Card>
  );
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
