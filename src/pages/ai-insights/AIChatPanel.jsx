import * as React from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useTranslation } from "react-i18next";

import { formatAIChatError, requestMarketAssistantReply } from "./aiChatService";
import AssetIcon from "../../components/AssetIcon";

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSuggestedQuestions(t, assetLabel, timeframeLabel) {
  const pair = assetLabel || t("aiInsights.chat.thisAsset", "this asset");
  const tf = timeframeLabel || t("aiInsights.chat.selectedTimeframe", "the selected timeframe");

  const items = [
    {
      label: t("aiInsights.chat.suggestions.biasLabel", "Bias & Summary"),
      message: t("aiInsights.chat.suggestions.biasMessage", {
        defaultValue: "Summarize the current bias on {{pair}} over {{tf}}.",
        pair,
        tf,
      }),
    },
    {
      label: t("aiInsights.chat.suggestions.levelsLabel", "Key Levels"),
      message: t("aiInsights.chat.suggestions.levelsMessage", {
        defaultValue: "What are the key support and resistance levels for {{pair}}?",
        pair,
      }),
    },
    {
      label: t("aiInsights.chat.suggestions.riskLabel", "Risk & Volatility"),
      message: t("aiInsights.chat.suggestions.riskMessage", {
        defaultValue: "Explain the current risk/volatility for {{pair}} over {{tf}} in plain language.",
        pair,
        tf,
      }),
    },
    {
      label: t("aiInsights.chat.suggestions.scenariosLabel", "Scenarios"),
      message: t("aiInsights.chat.suggestions.scenariosMessage", {
        defaultValue: "Give base/bull/bear scenarios for {{pair}} over {{tf}}.",
        pair,
        tf,
      }),
    },
  ];

  return items
    .map((q) => ({
      ...q,
      message: String(q.message).replace(/\s+/g, " ").trim(),
    }))
    .filter((q) => q.label && q.message);
}

function directionTone(direction) {
  if (direction === "Bullish") return { color: "#22c55e", bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.35)" };
  if (direction === "Bearish") return { color: "#ef4444", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.35)" };
  return { color: "rgba(255,255,255,0.82)", bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.18)" };
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

function buildInlineContextLabel(assetLabel, timeframeLabel) {
  const bits = [assetLabel, timeframeLabel].filter(Boolean);
  if (!bits.length) return "";
  return bits.join(" • ");
}

function ChatBubble({ role, children }) {
  const isUser = role === "user";

  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <Box
        sx={{
          maxWidth: "88%",
          px: 1.7,
          py: 1.3,
          borderRadius: 4,
          border: isUser
            ? "1px solid rgba(58,198,255,0.35)"
            : "1px solid rgba(255,255,255,0.12)",
          background: isUser
            ? "linear-gradient(135deg, rgba(58,198,255,0.18), rgba(123,92,255,0.12))"
            : "rgba(0,0,0,0.22)",
          boxShadow: isUser
            ? "0 14px 30px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack direction="row" spacing={0.9} alignItems="flex-start">
          {isUser ? (
            <PersonOutlineOutlinedIcon sx={{ fontSize: 18, opacity: 0.75, mt: "2px" }} />
          ) : (
            <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, opacity: 0.85, mt: "2px", color: "#39c6ff" }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                fontWeight: isUser ? 800 : 700,
                color: "rgba(255,255,255,0.92)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {children}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default function AIChatPanel({ instrument, assetLabel, timeframeLabel, marketContext }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [draft, setDraft] = React.useState("");
  const [pendingCount, setPendingCount] = React.useState(0);
  const [messages, setMessages] = React.useState(() => [
    {
      id: createMessageId(),
      role: "assistant",
      text:
        t(
          "aiInsights.chat.welcome",
          "Ask a market question and I’ll answer using the live context on this page (trend, stats, and risk signals). This is educational analysis — not financial advice.",
        ),
    },
  ]);

  const scrollRef = React.useRef(null);
  const messagesRef = React.useRef(messages);
  const requestQueueRef = React.useRef(Promise.resolve());
  const abortersRef = React.useRef([]);

  const aiConfig = React.useMemo(() => {
    const endpoint = String(process.env.REACT_APP_AI_CHAT_ENDPOINT || "").trim();
    const hasEndpoint = Boolean(endpoint);
    const hasKey = Boolean(String(process.env.REACT_APP_OPENAI_API_KEY || "").trim());
    const explicit = String(process.env.REACT_APP_ALLOW_BROWSER_AI || "")
      .trim()
      .toLowerCase();
    const allowBrowserKey =
      explicit === "true"
        ? true
        : explicit === "false"
          ? false
          : process.env.NODE_ENV !== "production";

    const mode = hasEndpoint ? "endpoint" : hasKey && allowBrowserKey ? "browserKey" : "offline";
    return { mode, hasEndpoint, hasKey, allowBrowserKey };
  }, []);

  const aiStatusLabel =
    aiConfig.mode === "endpoint"
      ? t("aiInsights.chat.modes.endpoint", "Endpoint")
      : aiConfig.mode === "browserKey"
        ? process.env.NODE_ENV === "production"
          ? t("aiInsights.chat.modes.key", "Key")
          : t("aiInsights.chat.modes.devKey", "Dev Key")
        : t("aiInsights.chat.modes.offline", "Offline");

  const suggestedQuestions = React.useMemo(
    () => getSuggestedQuestions(t, assetLabel, timeframeLabel),
    [t, assetLabel, timeframeLabel],
  );

  const categoryLabel = React.useMemo(() => {
    const c = String(instrument?.category || "").toLowerCase();
    if (c === "crypto") return t("aiInsights.assetCategory.crypto", "Crypto");
    if (c === "forex") return t("aiInsights.assetCategory.forex", "Forex");
    if (c === "metals") return t("aiInsights.assetCategory.metals", "Metals");
    return "";
  }, [instrument?.category, t]);

  const contextHint = React.useMemo(
    () => buildInlineContextLabel(assetLabel, timeframeLabel),
    [assetLabel, timeframeLabel],
  );

  const analysisSummary = marketContext?.analysis || null;
  const directionChip = React.useMemo(() => {
    const direction = analysisSummary?.direction;
    const confidence = analysisSummary?.confidence;
    const risk = analysisSummary?.risk;
    if (!direction || typeof direction !== "string") return null;
    const directionLabel = localizeDirection(t, direction) || direction;
    const riskLabel = localizeRisk(t, risk) || risk;
    if (!Number.isFinite(Number(confidence)) || !risk) {
      return { label: directionLabel, tone: directionTone(direction) };
    }
    return {
      label: `${directionLabel} • ${confidence}% • ${riskLabel}`,
      tone: directionTone(direction),
    };
  }, [t, analysisSummary?.direction, analysisSummary?.confidence, analysisSummary?.risk]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pendingCount]);

  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  React.useEffect(() => {
    return () => {
      for (const abort of abortersRef.current) abort?.();
      abortersRef.current = [];
    };
  }, []);

  function buildFallbackReply(err, contextSnapshot) {
    const hint = formatAIChatError(err);
    const inline = buildInlineContextLabel(
      contextSnapshot?.asset?.pairLabel || assetLabel,
      contextSnapshot?.timeframe?.label || timeframeLabel,
    );

    const dir = contextSnapshot?.analysis?.direction;
    const conf = contextSnapshot?.analysis?.confidence;
    const risk = contextSnapshot?.analysis?.risk;
    const trend = contextSnapshot?.analysis?.signals?.overallChangePct;
    const momentum = contextSnapshot?.analysis?.signals?.momentumChangePct;
    const range = contextSnapshot?.analysis?.signals?.rangePct;
    const maxDd = contextSnapshot?.analysis?.signals?.maxDrawdownPct;
    const support = contextSnapshot?.analysis?.signals?.support;
    const resistance = contextSnapshot?.analysis?.signals?.resistance;

    const vsCurrency = contextSnapshot?.asset?.vsCurrency || "usd";
    const price = contextSnapshot?.marketStats?.close;
    const change = contextSnapshot?.marketStats?.changePct;

    const contextLine = inline
      ? `${t("aiInsights.chat.contextPrefix", "Context")}: ${inline}`
      : t("aiInsights.chat.fallback.contextMissing", "Context: --");

    const dirLabel = localizeDirection(t, dir) || dir;
    const riskLabel = localizeRisk(t, risk) || risk;

    const snap = [
      dir
        ? t("aiInsights.chat.fallback.snapshotLine", {
            defaultValue: "Rule-based snapshot: {{direction}}",
            direction: dirLabel,
          })
        : null,
      Number.isFinite(Number(conf))
        ? t("aiInsights.chat.fallback.confidenceLine", {
            defaultValue: "Confidence {{value}}%",
            value: conf,
          })
        : null,
      risk
        ? t("aiInsights.chat.fallback.riskLine", {
            defaultValue: "Risk {{value}}",
            value: riskLabel,
          })
        : null,
    ]
      .filter(Boolean)
      .join(" • ");

    const fmtPct = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "--";
      const s = n > 0 ? "+" : "";
      return `${s}${n.toFixed(2)}%`;
    };

    const fmtMoney = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "--";
      const c = String(vsCurrency || "usd").toUpperCase();
      const digits = n >= 1000 ? 0 : n >= 1 ? 2 : 6;
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: digits }).format(n);
      } catch {
        return n.toFixed(Math.min(6, digits));
      }
    };

    const signalsLine = t("aiInsights.chat.fallback.signalsLine", {
      defaultValue: "Signals: Trend {{trend}} • Momentum {{momentum}} • Range {{range}} • MaxDD {{maxDd}}",
      trend: fmtPct(trend),
      momentum: fmtPct(momentum),
      range: fmtPct(range),
      maxDd: fmtPct(maxDd),
    });

    const levelsLine = t("aiInsights.chat.fallback.levelsLine", {
      defaultValue: "Levels: Support {{support}} • Resistance {{resistance}}",
      support: fmtMoney(support),
      resistance: fmtMoney(resistance),
    });
    const priceLine = t("aiInsights.chat.fallback.priceLine", {
      defaultValue: "Price: {{price}} ({{change}})",
      price: fmtMoney(price),
      change: fmtPct(change),
    });

    if (String(err?.code) === "AI_NOT_CONFIGURED") {
      return [
        contextLine,
        t("aiInsights.chat.fallback.offlineLine", "Assistant: Offline (AI not configured)."),
        priceLine,
        snap || t("aiInsights.chat.fallback.snapshotEmpty", "Rule-based snapshot: --"),
        signalsLine,
        levelsLine,
        t(
          "aiInsights.chat.fallback.enableLine",
          "To enable AI: set `REACT_APP_AI_CHAT_ENDPOINT` and restart the app.",
        ),
      ].join("\n");
    }

    return [
      contextLine,
      t("aiInsights.chat.fallback.unavailableLine", "Assistant: Temporarily unavailable."),
      priceLine,
      snap || t("aiInsights.chat.fallback.snapshotEmpty", "Rule-based snapshot: --"),
      signalsLine,
      levelsLine,
      hint
        ? t("aiInsights.chat.fallback.errorLine", { defaultValue: "Error: {{message}}", message: hint })
        : null,
      t(
        "aiInsights.chat.fallback.tryAgainLine",
        "Try again in a moment — the live chart and deterministic analysis are still available.",
      ),
    ]
      .filter(Boolean)
      .join("\n");
  }

  function sendUserMessage(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;

    const userMessage = { id: createMessageId(), role: "user", text: trimmed };
    const snapshotMessages = [...(messagesRef.current || []), userMessage];
    const contextSnapshot = marketContext || null;

    setMessages(snapshotMessages);
    messagesRef.current = snapshotMessages;
    setDraft("");

    requestQueueRef.current = requestQueueRef.current
      .then(async () => {
        setPendingCount((c) => c + 1);

        const controller = new AbortController();
        const abort = () => controller.abort();
        abortersRef.current.push(abort);

        try {
          const reply = await requestMarketAssistantReply({
            messages: snapshotMessages,
            marketContext: contextSnapshot,
            signal: controller.signal,
          });

          setMessages((m) => [...m, { id: createMessageId(), role: "assistant", text: reply }]);
        } catch (err) {
          console.error(
            "[AI Insights][Chat] Assistant request failed",
            {
              mode: aiConfig.mode,
              code: err?.code,
              name: err?.name,
              message: err?.message,
            },
            err,
          );
          setMessages((m) => [
            ...m,
            { id: createMessageId(), role: "assistant", text: buildFallbackReply(err, contextSnapshot) },
          ]);
        } finally {
          abortersRef.current = abortersRef.current.filter((a) => a !== abort);
          setPendingCount((c) => Math.max(0, c - 1));
        }
      })
      .catch((err) => {
        console.error("[AI Insights][Chat] Unhandled request queue error", err);
      });
  }

  return (
    <Card
      sx={{
        borderRadius: 5,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        height: { xs: 560, sm: 580, md: "calc(100vh - 170px)" },
        position: { md: "sticky" },
        top: { md: 112 },
        display: "flex",
        flexDirection: "column",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2.2, md: 2.6 },
          py: 1.7,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.4,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SmartToyOutlinedIcon sx={{ color: "#7b5cff" }} />
          <Box>
            <Typography sx={{ fontWeight: 1000, fontSize: 16, letterSpacing: "-0.01em" }}>
              {t("aiInsights.chat.title", "AI Market Assistant")}
            </Typography>
            <Typography sx={{ mt: 0.25, opacity: 0.7, fontSize: 12 }}>
              {contextHint
                ? `${t("aiInsights.chat.contextPrefix", "Context")}: ${contextHint}`
                : t(
                    "aiInsights.chat.subtitle",
                    "Context-aware answers tied to this instrument and timeframe.",
                  )}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ direction: "ltr" }}>
          {assetLabel ? (
            <Chip
              icon={instrument ? <AssetIcon asset={instrument} size={18} /> : undefined}
              label={assetLabel}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(58,198,255,0.30)",
                bgcolor: "rgba(58,198,255,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                "& .MuiChip-icon": { ml: 0.3, mr: -0.3 },
              }}
            />
          ) : null}
          {categoryLabel ? (
            <Chip
              label={categoryLabel}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(0,0,0,0.18)",
              }}
            />
          ) : null}
          {timeframeLabel ? (
            <Chip
              label={t("aiInsights.chat.timeframe", {
                defaultValue: "TF: {{label}}",
                label: timeframeLabel,
              })}
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
          ) : null}
          {directionChip ? (
            <Chip
              label={directionChip.label}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: directionChip.tone.color,
                border: `1px solid ${directionChip.tone.border}`,
                bgcolor: directionChip.tone.bg,
              }}
            />
          ) : null}
          <Chip
            label={t("aiInsights.chat.aiChip", {
              defaultValue: "AI: {{mode}}",
              mode: aiStatusLabel,
            })}
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

      {/* Suggested questions */}
      {aiConfig.mode === "offline" ? (
        <Box
          sx={{
            mx: { xs: 2.2, md: 2.6 },
            mt: 1.6,
            mb: 0.2,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.10)",
            bgcolor: "rgba(0,0,0,0.18)",
            px: 1.7,
            py: 1.3,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>
            {t("aiInsights.chat.offlineTitle", "AI is offline (missing configuration)")}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 11, opacity: 0.7, lineHeight: 1.45 }}>
            {t(
              "aiInsights.chat.offlineBody",
              "Set `REACT_APP_AI_CHAT_ENDPOINT` (recommended) and restart the dev server/build. Browser API keys are intentionally disabled by default in production.",
            )}
          </Typography>
        </Box>
      ) : null}
      <Box sx={{ px: { xs: 2.2, md: 2.6 }, py: 1.6 }}>
        <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>
          {t("aiInsights.chat.suggestedTitle", "Suggested Questions")}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.1, direction: "ltr" }}
        >
          {suggestedQuestions.map((q) => (
            <Chip
              key={q.label}
              label={q.label}
              onClick={() => sendUserMessage(q.message)}
              size="small"
              sx={{
                height: 28,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(0,0,0,0.18)",
                "&:hover": {
                  bgcolor: "rgba(58,198,255,0.10)",
                  borderColor: "rgba(58,198,255,0.25)",
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {/* Conversation */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 2.2, md: 2.6 },
          py: 2,
          backgroundImage:
            "radial-gradient(900px 280px at 50% 0%, rgba(57,198,255,0.10) 0%, rgba(0,0,0,0) 62%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "cover, 56px 56px, 56px 56px",
          backgroundPosition: "center, center, center",
        }}
      >
        <Stack spacing={1.2}>
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role}>
              {m.text}
            </ChatBubble>
          ))}

          {pendingCount > 0 ? (
            <ChatBubble role="assistant">{t("aiInsights.chat.typing", "Typing…")}</ChatBubble>
          ) : null}
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {/* Composer */}
      <Box sx={{ px: { xs: 2.2, md: 2.6 }, py: 1.8 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ direction: "ltr" }}>
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendUserMessage(draft);
              }
            }}
            placeholder={t("aiInsights.chat.inputPlaceholder", "Ask a market question…")}
            size="small"
            fullWidth
            inputProps={{ "aria-label": t("aiInsights.chat.inputAria", "Chat message") }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.22)",
                color: "rgba(255,255,255,0.92)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.20)" },
                "&.Mui-focused fieldset": { borderColor: "rgba(58,198,255,0.45)" },
              },
              "& input::placeholder": { color: "rgba(255,255,255,0.55)", opacity: 1 },
            }}
          />

          <IconButton
            onClick={() => sendUserMessage(draft)}
            disabled={!String(draft || "").trim()}
            aria-label={t("aiInsights.chat.sendAria", "Send")}
            sx={{
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(58,198,255,0.30)",
              background:
                "linear-gradient(135deg, rgba(58,198,255,0.22), rgba(123,92,255,0.16))",
              color: "rgba(255,255,255,0.92)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(58,198,255,0.28), rgba(123,92,255,0.18))",
              },
              "&.Mui-disabled": {
                opacity: 0.45,
              },
            }}
          >
            <SendRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        <Typography sx={{ mt: 1.2, fontSize: 11, opacity: 0.6 }}>
          {t(
            "aiInsights.chat.educationalNote",
            "Educational note: responses are contextual analysis, not guaranteed outcomes or financial advice.",
          )}
        </Typography>
      </Box>
    </Card>
  );
}
