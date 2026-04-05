function safeJsonStringify(value, space = 2) {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return "{}";
  }
}

function parseErrorMessage(err) {
  if (!err) return "Unknown error.";
  if (typeof err === "string") return err;
  if (err?.message) return String(err.message);
  return "Unknown error.";
}

function isProbablyNetworkError(err) {
  const msg = String(err?.message || "");
  return (
    err?.name === "TypeError" &&
    (msg.includes("Failed to fetch") || msg.includes("NetworkError"))
  );
}

async function readJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function toChatCompletionMessages(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  return arr
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, content: m.text }));
}

function formatNumber(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(digits);
}

function formatSignedPct(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

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

function buildContextSummary(marketContext) {
  const ctx = marketContext && typeof marketContext === "object" ? marketContext : {};
  const asset = ctx.asset || {};
  const tf = ctx.timeframe || {};
  const stats = ctx.marketStats || {};
  const analysis = ctx.analysis || {};
  const signals = analysis.signals || {};

  const pair = asset.pairLabel || asset.symbol || asset.name || "Asset";
  const tfLabel = tf.label || tf.id || "TF";
  const vsCurrency = asset.vsCurrency;

  const direction = analysis.direction || "--";
  const confidence = Number.isFinite(Number(analysis.confidence)) ? `${analysis.confidence}%` : "--";
  const risk = analysis.risk || "--";

  const price = formatMoney(stats.close, vsCurrency);
  const change = formatSignedPct(stats.changePct, 2);
  const high = formatMoney(stats.high, vsCurrency);
  const low = formatMoney(stats.low, vsCurrency);

  const trend = formatSignedPct(signals.overallChangePct, 2);
  const momentum = formatSignedPct(signals.momentumChangePct, 2);
  const range = Number.isFinite(Number(signals.rangePct))
    ? `${formatNumber(signals.rangePct, 2)}%`
    : "--";
  const maxDd = Number.isFinite(Number(signals.maxDrawdownPct))
    ? `${formatNumber(signals.maxDrawdownPct, 2)}%`
    : "--";

  const support = formatMoney(signals.support, vsCurrency);
  const resistance = formatMoney(signals.resistance, vsCurrency);

  return [
    `Context: ${pair} • ${tfLabel}`,
    `Snapshot: ${direction} • Risk ${risk} • Confidence ${confidence}`,
    `Price: ${price} (${change}) • High ${high} • Low ${low}`,
    `Signals: Trend ${trend} • Momentum ${momentum} • Range ${range} • MaxDD ${maxDd}`,
    `Levels: Support ${support} • Resistance ${resistance}`,
  ].join("\n");
}

function buildSystemPrompt() {
  return [
    "You are RateFlow's AI Market Assistant for a trading-style dashboard.",
    "You will receive structured MARKET_CONTEXT_JSON (asset, timeframe, marketStats, and a rule-based analysis with signals).",
    "Answer the user's message as a contextual market assistant using ONLY the provided context.",
    "",
    "Rules:",
    "- Use the numbers/signals from MARKET_CONTEXT_JSON when possible (trend, momentum, volatility/range, support/resistance, max drawdown).",
    "- Tie your answer to the selected asset and timeframe explicitly.",
    "- If the user asks 'Will it go up?' or similar: respond with scenarios + triggers (break above resistance / below support), not certainty.",
    "- Do not give direct buy/sell instructions. Do not guarantee outcomes. No hype.",
    "- Avoid generic chatbot filler (no 'as an AI language model'). Do not mention MARKET_CONTEXT_JSON in the answer.",
    "- Keep it concise and finance-style: ~6-10 short lines, with bullets allowed.",
    "",
    "Answer format:",
    "1) One short context line (pair + timeframe).",
    "2) A direct, cautious directional read (direction + risk + confidence).",
    "3) 3-5 bullet lines: evidence from signals, key levels, scenarios, and what could invalidate the read.",
    "4) End with one short risk note (not advice).",
  ].join("\n");
}

function buildContextMessage(marketContext) {
  return [
    "MARKET_CONTEXT_SUMMARY:",
    buildContextSummary(marketContext),
    "",
    "MARKET_CONTEXT_JSON:",
    safeJsonStringify(marketContext, 2),
    "",
    "Use this context as the source of truth for your answer. Do not invent missing numbers.",
  ].join("\n");
}

async function requestViaCustomEndpoint({ endpoint, messages, marketContext, signal }) {
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: safeJsonStringify({ messages, marketContext }, 0),
      signal,
    });
  } catch (err) {
    if (isProbablyNetworkError(err)) {
      const e = new Error(
        "Network/CORS error reaching the AI endpoint. Verify `REACT_APP_AI_CHAT_ENDPOINT` is correct and accessible from the browser.",
      );
      e.code = "AI_REQUEST_FAILED";
      throw e;
    }
    throw err;
  }

  const data = await readJsonSafely(res);

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `AI endpoint error (${res.status}).`;
    throw new Error(msg);
  }

  const reply = data?.reply || data?.message || data?.text;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("AI endpoint returned an empty reply.");
  }

  return reply.trim();
}

async function requestViaOpenAI({ apiKey, baseUrl, model, messages, marketContext, signal }) {
  const url = `${String(baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;

  const history = toChatCompletionMessages(messages).slice(-12);
  const payload = {
    model: model || "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 350,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildContextMessage(marketContext) },
      ...history,
    ],
  };

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: safeJsonStringify(payload, 0),
      signal,
    });
  } catch (err) {
    if (isProbablyNetworkError(err)) {
      const e = new Error(
        "Network/CORS error reaching the OpenAI API. Prefer using `REACT_APP_AI_CHAT_ENDPOINT` (server-side proxy) instead of calling OpenAI directly from the browser.",
      );
      e.code = "AI_REQUEST_FAILED";
      throw e;
    }
    throw err;
  }

  const data = await readJsonSafely(res);

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `OpenAI request failed (${res.status}).`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OpenAI returned an empty reply.");
  }

  return text.trim();
}

function isBrowserKeyAllowed() {
  const explicit = String(process.env.REACT_APP_ALLOW_BROWSER_AI || "").trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export async function requestMarketAssistantReply({ messages, marketContext, signal } = {}) {
  const endpoint = String(process.env.REACT_APP_AI_CHAT_ENDPOINT || "").trim();
  if (endpoint) {
    return requestViaCustomEndpoint({ endpoint, messages, marketContext, signal });
  }

  if (!isBrowserKeyAllowed()) {
    const err = new Error(
      "AI is not configured. For security, browser API keys are disabled in production — use REACT_APP_AI_CHAT_ENDPOINT.",
    );
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const apiKey = String(process.env.REACT_APP_OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("AI is not configured (missing API key).");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  return requestViaOpenAI({
    apiKey,
    baseUrl: String(process.env.REACT_APP_OPENAI_BASE_URL || "").trim() || undefined,
    model: String(process.env.REACT_APP_OPENAI_MODEL || "").trim() || undefined,
    messages,
    marketContext,
    signal,
  });
}

export function formatAIChatError(err) {
  const msg = parseErrorMessage(err);
  if (String(err?.code) === "AI_NOT_CONFIGURED") return msg;
  return msg;
}
