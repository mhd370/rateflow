import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useTranslation } from "react-i18next";

import LightweightCandlesChart from "./LightweightCandlesChart";
import { formatAIChatError, requestMarketAssistantReply } from "./aiChatService";

function formatMoney(value, vsCurrency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";

  const currency = String(vsCurrency || "usd").toUpperCase();
  const maximumFractionDigits = n >= 1000 ? 0 : n >= 1 ? 2 : 6;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(n);
  } catch {
    return n.toFixed(Math.min(6, maximumFractionDigits));
  }
}

function formatProb(p) {
  const v = Number(p);
  if (!Number.isFinite(v)) return "--";
  return `${Math.round(v * 100)}%`;
}

function StatCard({ label, value, valueColor, sub, children }) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <CardContent sx={{ px: 2, py: 1.8, "&:last-child": { pb: 1.8 } }}>
        <Typography sx={{ fontSize: 11, opacity: 0.72, fontWeight: 900 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.7,
            fontWeight: 1100,
            fontSize: { xs: 18, md: 20 },
            letterSpacing: "-0.01em",
            color: valueColor || "rgba(255,255,255,0.92)",
          }}
        >
          {value}
        </Typography>
        {sub ? (
          <Typography sx={{ mt: 0.45, fontSize: 11, opacity: 0.6 }}>
            {sub}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

export default function TargetAnalysisModal({
  open,
  onClose,
  candles,
  assetLabel,
  timeframeLabel,
  vsCurrency,
  analysisResult,
  contextSnapshot,
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const ok = Boolean(analysisResult?.ok);
  const signal = analysisResult?.signal || "No Trade";
  const confidence = Number.isFinite(Number(analysisResult?.confidence))
    ? `${analysisResult.confidence}%`
    : "--";
  const rawRisk = analysisResult?.risk || "--";
  const rawDirection = analysisResult?.direction || "--";

  const risk =
    rawRisk === "Low"
      ? t("aiInsights.analysis.risk.low", "Low")
      : rawRisk === "Medium"
        ? t("aiInsights.analysis.risk.medium", "Medium")
        : rawRisk === "High"
          ? t("aiInsights.analysis.risk.high", "High")
          : rawRisk;

  const direction =
    rawDirection === "Bullish"
      ? t("aiInsights.analysis.direction.bullish", "Bullish")
      : rawDirection === "Bearish"
        ? t("aiInsights.analysis.direction.bearish", "Bearish")
        : rawDirection === "Neutral"
          ? t("aiInsights.analysis.direction.neutral", "Neutral")
          : rawDirection;

  const signalMeta =
    signal === "Buy"
      ? { label: t("aiInsights.targets.signal.buy", "Buy"), color: "#22c55e" }
      : signal === "Sell"
        ? { label: t("aiInsights.targets.signal.sell", "Sell"), color: "#ef4444" }
        : { label: t("aiInsights.targets.signal.noTrade", "No Trade"), color: "rgba(255,255,255,0.80)" };

  const priceLines = ok ? analysisResult?.overlays?.priceLines || [] : [];
  const trendlines = ok ? analysisResult?.overlays?.trendlines || [] : [];

  const [aiState, setAiState] = React.useState({ loading: false, error: "", text: "" });

  React.useEffect(() => {
    if (!open) return;
    if (!ok) {
      setAiState({ loading: false, error: "", text: "" });
      return;
    }

    const controller = new AbortController();
    setAiState({ loading: true, error: "", text: "" });

    const prompt = t(
      "aiInsights.targets.aiExplainPrompt",
      "Explain this target analysis result. Use the provided probabilities, levels, and detected patterns. Give scenarios and risk notes. Do not give financial advice.",
    );

    requestMarketAssistantReply({
      messages: [{ role: "user", text: prompt }],
      marketContext: contextSnapshot || {},
      signal: controller.signal,
    })
      .then((reply) => {
        if (controller.signal.aborted) return;
        setAiState({ loading: false, error: "", text: reply });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAiState({ loading: false, error: formatAIChatError(err), text: "" });
      });

    return () => controller.abort();
  }, [open, ok, contextSnapshot, t]);

  const prob1 = ok ? analysisResult?.probabilities?.target1 : null;
  const prob2 = ok ? analysisResult?.probabilities?.target2 : null;

  const t1 = ok ? analysisResult?.targets?.target1 : null;
  const t2 = ok ? analysisResult?.targets?.target2 : null;
  const suggestion = ok ? analysisResult?.targets?.suggestion : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 5 },
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(145deg, rgba(18,33,67,0.95) 0%, rgba(10,20,45,0.93) 55%, rgba(6,10,22,0.96) 100%)",
          boxShadow:
            "0 30px 85px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.05)",
          color: "#fff",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.6 },
          py: 1.8,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <InsightsOutlinedIcon sx={{ color: "rgba(251,191,36,0.92)" }} />
          <Box>
            <Typography sx={{ fontWeight: 1100, fontSize: 16, letterSpacing: "-0.01em" }}>
              {t("aiInsights.targets.modalTitle", "Target Analysis Mode")}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12, opacity: 0.68 }}>
              {assetLabel} | {timeframeLabel}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ direction: "ltr" }}>
          <Chip
            label={signalMeta.label}
            size="small"
            sx={{
              height: 24,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 1000,
              color: signalMeta.color,
              border: `1px solid ${signalMeta.color}55`,
              bgcolor: `${signalMeta.color}1A`,
            }}
          />
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.82)" }}>
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ p: { xs: 2, md: 2.6 } }}>
        {!ok ? (
          <Card
            sx={{
              borderRadius: 5,
              border: "1px solid rgba(255,120,120,0.35)",
              backgroundColor: "rgba(0,0,0,0.22)",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <CardContent sx={{ px: 2.4, py: 2.2 }}>
              <Typography sx={{ fontWeight: 1100, fontSize: 15 }}>
                {t("aiInsights.targets.errors.title", "Unable to run target analysis")}
              </Typography>
              <Typography sx={{ mt: 0.8, opacity: 0.75, fontSize: 13 }}>
                {analysisResult?.error || t("common.unknownError", "Unknown error.")}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.25fr) minmax(0, 1fr)" },
              gap: { xs: 2, md: 2.4 },
              alignItems: "start",
            }}
          >
            {/* Chart + overlays */}
            <Card
              sx={{
                borderRadius: 5,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
                backgroundColor: "rgba(0,0,0,0.16)",
                backdropFilter: "blur(12px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <Box
                sx={{
                  px: 2.2,
                  py: 1.6,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 1100, fontSize: 14 }}>
                    {t("aiInsights.targets.chartTitle", "Technical Overlay Chart")}
                  </Typography>
                  <Chip
                    label={direction}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: 999,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.88)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      bgcolor: "rgba(0,0,0,0.18)",
                    }}
                  />
                </Stack>

                <Chip
                  label={t("aiInsights.chart.provider", "Lightweight Charts")}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 999,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    bgcolor: "rgba(0,0,0,0.18)",
                  }}
                />
              </Box>
              <Box sx={{ height: { xs: 320, md: 460 }, position: "relative" }}>
                <LightweightCandlesChart
                  data={candles}
                  locale={i18n.language}
                  height="100%"
                  priceLines={priceLines}
                  trendlines={trendlines}
                />
              </Box>
            </Card>

            {/* Result summary */}
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 1.3,
                }}
              >
                <StatCard
                  label={t("aiInsights.targets.summary.signal", "Signal")}
                  value={signalMeta.label}
                  valueColor={signalMeta.color}
                  sub={t("aiInsights.targets.summary.deterministic", "Deterministic TA engine")}
                />
                <StatCard
                  label={t("aiInsights.targets.summary.confidence", "Confidence")}
                  value={confidence}
                  sub={t("aiInsights.targets.summary.modelFree", "No LLM guessing")}
                />
                <StatCard label={t("aiInsights.targets.summary.risk", "Risk")} value={risk} />
              </Box>

              <Box
                sx={{
                  mt: 1.6,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.3,
                }}
              >
                <StatCard
                  label={t("aiInsights.targets.summary.target1Prob", "Target 1 reach probability")}
                  value={formatProb(prob1)}
                  sub={t("aiInsights.targets.summary.target1", { defaultValue: "T1: {{price}}", price: formatMoney(t1, vsCurrency) })}
                >
                  <LinearProgress
                    variant="determinate"
                    value={Number.isFinite(Number(prob1)) ? clamp(Number(prob1) * 100, 0, 100) : 0}
                    sx={{
                      mt: 1.2,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.10)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "rgba(251,191,36,0.92)",
                      },
                    }}
                  />
                </StatCard>

                <StatCard
                  label={t("aiInsights.targets.summary.target2Prob", "Target 2 reach probability")}
                  value={formatProb(prob2)}
                  sub={t("aiInsights.targets.summary.target2", { defaultValue: "T2: {{price}}", price: formatMoney(t2, vsCurrency) })}
                >
                  <LinearProgress
                    variant="determinate"
                    value={Number.isFinite(Number(prob2)) ? clamp(Number(prob2) * 100, 0, 100) : 0}
                    sx={{
                      mt: 1.2,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.10)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "rgba(167,139,250,0.92)",
                      },
                    }}
                  />
                </StatCard>
              </Box>

              {analysisResult?.summary ? (
                <Card
                  sx={{
                    mt: 1.6,
                    borderRadius: 5,
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <CardContent sx={{ px: 2.2, py: 2.0 }}>
                    <Typography sx={{ fontWeight: 1100, fontSize: 13 }}>
                      {t("aiInsights.targets.summary.title", "Deterministic Summary")}
                    </Typography>
                    <Typography sx={{ mt: 0.8, opacity: 0.78, fontSize: 12.5, lineHeight: 1.6 }}>
                      {analysisResult.summary}
                    </Typography>
                  </CardContent>
                </Card>
              ) : null}

              {suggestion?.near && suggestion?.far ? (
                <Card
                  sx={{
                    mt: 1.6,
                    borderRadius: 5,
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <CardContent sx={{ px: 2.2, py: 2.0 }}>
                    <Typography sx={{ fontWeight: 1100, fontSize: 13 }}>
                      {t("aiInsights.targets.suggestions.title", "Suggested Alternatives")}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.1 }}>
                      <Chip
                        label={t("aiInsights.targets.suggestions.near", {
                          defaultValue: "Near: {{price}}",
                          price: formatMoney(suggestion.near, vsCurrency),
                        })}
                        size="small"
                        sx={{
                          height: 24,
                          borderRadius: 999,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.90)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          bgcolor: "rgba(0,0,0,0.18)",
                        }}
                      />
                      <Chip
                        label={t("aiInsights.targets.suggestions.far", {
                          defaultValue: "Far: {{price}}",
                          price: formatMoney(suggestion.far, vsCurrency),
                        })}
                        size="small"
                        sx={{
                          height: 24,
                          borderRadius: 999,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.90)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          bgcolor: "rgba(0,0,0,0.18)",
                        }}
                      />
                    </Stack>
                    <Typography sx={{ mt: 1.1, opacity: 0.7, fontSize: 12 }}>
                      {t(
                        "aiInsights.targets.suggestions.note",
                        "These are rule-based alternatives when a target is far relative to recent ATR/volatility.",
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              ) : null}

              {Array.isArray(analysisResult?.patterns) && analysisResult.patterns.length ? (
                <Card
                  sx={{
                    mt: 1.6,
                    borderRadius: 5,
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <CardContent sx={{ px: 2.2, py: 2.0 }}>
                    <Typography sx={{ fontWeight: 1100, fontSize: 13 }}>
                      {t("aiInsights.targets.patterns.title", "Detected Structures")}
                    </Typography>
                    <Stack spacing={0.8} sx={{ mt: 1.1 }}>
                      {analysisResult.patterns.slice(0, 6).map((p) => (
                        <Box
                          key={p.type}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={p.type}
                            size="small"
                            sx={{
                              height: 22,
                              borderRadius: 999,
                              fontSize: 11,
                              color: "rgba(255,255,255,0.90)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              bgcolor: "rgba(0,0,0,0.18)",
                            }}
                          />
                          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
                            {t("aiInsights.targets.patterns.conf", {
                              defaultValue: "Confidence {{value}}",
                              value: formatProb(p.confidence),
                            })}
                          </Typography>
                          <Typography sx={{ fontSize: 12, opacity: 0.65 }}>
                            {p.summary}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {/* AI explanation */}
              <Card
                sx={{
                  mt: 1.6,
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(0,0,0,0.18)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <CardContent sx={{ px: 2.2, py: 2.0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesomeOutlinedIcon sx={{ color: "#39c6ff" }} />
                    <Typography sx={{ fontWeight: 1100, fontSize: 13 }}>
                      {t("aiInsights.targets.aiTitle", "AI Explanation")}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Chip
                      label={t("aiInsights.targets.aiUsesDeterministic", "Uses deterministic result")}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: 999,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.86)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        bgcolor: "rgba(0,0,0,0.18)",
                      }}
                    />
                  </Stack>

                  {aiState.loading ? (
                    <Box sx={{ mt: 1.3 }}>
                      <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                        {t("aiInsights.targets.aiLoading", "Generating explanation...")}
                      </Typography>
                      <LinearProgress
                        sx={{
                          mt: 1,
                          height: 8,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.10)",
                          "& .MuiLinearProgress-bar": { bgcolor: "rgba(57,198,255,0.85)" },
                        }}
                      />
                    </Box>
                  ) : aiState.error ? (
                    <Box sx={{ mt: 1.3 }}>
                      <Typography sx={{ fontWeight: 1000, fontSize: 12.5 }}>
                        {t("aiInsights.targets.aiUnavailable", "AI explanation unavailable")}
                      </Typography>
                      <Typography sx={{ mt: 0.6, fontSize: 12, opacity: 0.75 }}>
                        {aiState.error}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        mt: 1.3,
                        fontSize: 12.6,
                        opacity: 0.86,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.65,
                      }}
                    >
                      {aiState.text ||
                        t(
                          "aiInsights.targets.aiPlaceholder",
                          "Ask the assistant in the chat panel for more context.",
                        )}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Stack direction="row" spacing={1} sx={{ mt: 1.8 }} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.88)",
                    "&:hover": { borderColor: "rgba(255,255,255,0.28)" },
                  }}
                >
                  {t("common.close", "Close")}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
