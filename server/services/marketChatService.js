function safeJsonStringify(value, space = 2) {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return "{}";
  }
}

function isDebugEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  const v = String(process.env.MARKET_CHAT_DEBUG || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function preview(value, maxChars = 800) {
  const s = String(value || "");
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}… [truncated ${s.length - maxChars} chars]`;
}

function summarizeMessagesForLog(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  return arr.map((m) => ({
    role: m?.role,
    chars: typeof m?.text === "string" ? m.text.length : 0,
    preview: preview(m?.text, 220),
  }));
}

function lastUserMessageText(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    const m = arr[i];
    if (m?.role === "user" && typeof m?.text === "string" && m.text.trim()) return m.text.trim();
  }
  return "";
}

function buildSystemPrompt() {
  return [
    "You are RateFlow's AI Market Assistant for a trading-style dashboard.",
    "You will receive MARKET_CONTEXT_JSON (asset, timeframe, marketStats, and a rule-based analysis with signals).",
    "MARKET_CONTEXT_JSON may also include selectedPoint (an OHLC snapshot at a user-clicked candle time).",
    "MARKET_CONTEXT_JSON may include targets (Target 1/2) and targetAnalysis (a deterministic TA engine result with signal, probabilities, levels, and detected patterns).",
    "If MARKET_CONTEXT_JSON.uiLanguage is 'ar', respond in Arabic. Otherwise, respond in English.",
    "Answer the user's message as a contextual market assistant using ONLY the provided context.",
    "Always respond to the user's latest question (do not output the same generic template for every question).",
    "",
    "Rules:",
    "- Use the numbers/signals from MARKET_CONTEXT_JSON when possible (trend, momentum, volatility/range, support/resistance, max drawdown).",
    "- Tie your answer to the selected asset and timeframe explicitly.",
    "- If selectedPoint exists, anchor your explanation to that point-in-time (its OHLC and nearby levels).",
    "- If targetAnalysis exists: treat it as the source of truth. Do not override the signal. Do not invent new probabilities. Explain the result relative to Target 1/2 using scenarios + triggers.",
    "- If the user asks 'Will it go up?' or similar: respond with scenarios + triggers, not certainty.",
    "- Do not give direct buy/sell instructions. Do not guarantee outcomes. No hype.",
    "- Avoid generic chatbot filler (no 'as an AI language model').",
    "- Keep it concise and finance-style: ~6-10 short lines, bullets allowed.",
    "",
    "Answer format:",
    "1) One short line that directly answers the user's question.",
    "2) One short context line (pair + timeframe).",
    "3) A direct, cautious directional read (direction + risk + confidence).",
    "4) If selectedPoint exists: 2-4 bullets describing what was happening at that moment (trend, momentum, levels) and scenario triggers.",
    "5) Otherwise: 3-5 bullets: evidence from signals, key levels, scenarios, and invalidation.",
    "6) End with one short risk note (not advice).",
  ].join("\n");
}

function clampMessages(history, max = 60) {
  const arr = Array.isArray(history) ? history : [];
  const filtered = arr.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string");
  // Drop leading assistant messages (e.g., a UI greeting) so the model prioritizes user questions.
  let start = 0;
  while (start < filtered.length && filtered[start]?.role !== "user") start += 1;
  const trimmed = filtered.slice(start);
  if (!Number.isFinite(Number(max)) || max <= 0) return trimmed;
  return trimmed.length > max ? trimmed.slice(trimmed.length - max) : trimmed;
}

function parseJsonSafely(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function requireGeminiConfig() {
  if (!requireGeminiConfig._didLog) requireGeminiConfig._didLog = false;

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("AI is not configured (missing GEMINI_API_KEY).");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const baseUrl = String(process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").trim();
  const model = String(process.env.GEMINI_MODEL || "").trim() || "gemini-2.5-flash";

  if (!requireGeminiConfig._didLog) {
    requireGeminiConfig._didLog = true;
    console.log("[market-chat] Gemini config", {
      model,
      baseUrl: baseUrl || "(default)",
      nodeEnv: process.env.NODE_ENV || "",
    });
  }

  return { apiKey, baseUrl, model };
}

function extractGeminiReplyText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const combined = parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (combined) return combined;
  }

  const fallback = data?.candidates?.[0]?.content?.text;
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();

  return "";
}

function formatHistoryForPrompt(messages, maxMessages = 12) {
  const arr = Array.isArray(messages) ? messages : [];
  if (!arr.length) return "";

  const limited =
    Number.isFinite(Number(maxMessages)) && maxMessages > 0 && arr.length > maxMessages
      ? arr.slice(arr.length - maxMessages)
      : arr;

  return limited
    .map((m) => {
      const label = m?.role === "assistant" ? "ASSISTANT" : "USER";
      return `${label}:\n${String(m?.text || "")}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildGeminiPrompt({ systemPrompt, marketContext, history, userText }) {
  const contextJson = safeJsonStringify(marketContext, 2);
  const historyBlock = formatHistoryForPrompt(history, 12);

  const chunks = [
    `SYSTEM:\n${systemPrompt}`,
    `CONTEXT:\n${contextJson}`,
    historyBlock ? `HISTORY:\n${historyBlock}` : "",
    `USER:\n${String(userText || "").trim()}`,
  ].filter(Boolean);

  return chunks.join("\n\n").trim();
}

function messagesBeforeLastUser(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    if (arr[i]?.role === "user") return arr.slice(0, i);
  }
  return arr;
}

async function requestGeminiReply({ messages, marketContext }) {
  const debug = isDebugEnabled();
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
  const { apiKey, baseUrl, model } = requireGeminiConfig();

  const history = clampMessages(messages, 60);
  const userText = lastUserMessageText(history) || history?.[history.length - 1]?.text || "";
  const priorHistory = messagesBeforeLastUser(history);
  const systemPrompt = buildSystemPrompt();
  const prompt = buildGeminiPrompt({
    systemPrompt,
    marketContext,
    history: priorHistory,
    userText,
  });

  const endpointBase = baseUrl.replace(/\/+$/, "");
  const url = `${endpointBase}/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 380,
    },
  };

  if (debug) {
    console.log(`[market-chat][${reqId}] incoming`, {
      messages: summarizeMessagesForLog(history),
      lastUserMessage: preview(userText, 240),
      asset: marketContext?.asset?.pairLabel || marketContext?.asset?.symbol || marketContext?.asset?.id,
      timeframe: marketContext?.timeframe?.label || marketContext?.timeframe?.id,
    });
    console.log(`[market-chat][${reqId}] gemini prompt`, {
      endpointBase,
      model,
      chars: prompt.length,
      preview: preview(prompt, 2200),
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: safeJsonStringify(payload, 0),
  });

  const rawText = await res.text();
  const data = parseJsonSafely(rawText);

  if (debug) {
    console.log(`[market-chat][${reqId}] gemini raw response`, {
      status: res.status,
      statusText: res.statusText,
      body: preview(rawText, 1400),
    });
  }

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      data?.error?.status ||
      `Gemini request failed (${res.status}).`;
    const err = new Error(msg);
    err.code = "AI_PROVIDER_ERROR";
    err.status = res.status;
    throw err;
  }

  if (!Array.isArray(data?.candidates) || data.candidates.length === 0) {
    const err = new Error("Gemini returned no candidates.");
    err.code = "AI_PROVIDER_ERROR";
    throw err;
  }

  const text = extractGeminiReplyText(data);
  if (!text) {
    return "I couldn't generate a response right now. Please try again.";
  }

  return text;
}

async function requestMarketChatReply({ messages, marketContext } = {}) {
  return requestGeminiReply({ messages, marketContext });
}

module.exports = {
  requestMarketChatReply,
};
