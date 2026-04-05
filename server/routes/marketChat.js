const express = require("express");

const { requestMarketChatReply } = require("../services/marketChatService");

const router = express.Router();

function jsonError(res, status, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    error: {
      message,
      code,
      ...extra,
    },
  });
}

function normalizeMessages(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const role = String(m.role || "").trim();
      const text = typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : "";
      return { role, text: String(text || "") };
    })
    .filter(Boolean);
}

function validatePayload({ messages, marketContext }) {
  const normalized = normalizeMessages(messages);
  if (!normalized.length) {
    return { ok: false, status: 400, code: "INVALID_MESSAGES", message: "messages must be a non-empty array." };
  }

  for (const m of normalized) {
    const role = String(m.role || "");
    if (role !== "user" && role !== "assistant") {
      return { ok: false, status: 400, code: "INVALID_MESSAGES", message: "messages contain an invalid role." };
    }
    if (!String(m.text || "").trim()) {
      return { ok: false, status: 400, code: "INVALID_MESSAGES", message: "messages contain empty text." };
    }
    if (String(m.text).length > 8000) {
      return { ok: false, status: 400, code: "INVALID_MESSAGES", message: "A message is too long." };
    }
  }

  if (!marketContext || typeof marketContext !== "object") {
    return { ok: false, status: 400, code: "INVALID_CONTEXT", message: "marketContext must be an object." };
  }

  return { ok: true, messages: normalized };
}

router.post("/", async (req, res) => {
  try {
    const { messages, marketContext } = req.body || {};
    const v = validatePayload({ messages, marketContext });
    if (!v.ok) return jsonError(res, v.status, v.code, v.message);

    const reply = await requestMarketChatReply({
      messages: v.messages,
      marketContext,
    });

    return res.json({ ok: true, reply });
  } catch (err) {
    const code = String(err?.code || "");
    const message = String(err?.message || "Internal server error.");

    if (code === "AI_NOT_CONFIGURED") {
      return jsonError(res, 503, code, message);
    }

    if (code === "AI_PROVIDER_ERROR") {
      return jsonError(res, 502, code, message);
    }

    console.error("[market-chat] failed:", err);
    return jsonError(res, 500, "SERVER_ERROR", message);
  }
});

module.exports = router;
