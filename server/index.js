const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");
const authRoutes = require("./routes/auth");
const marketChatRoutes = require("./routes/marketChat");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://rateflow1.netlify.app",
  "https://bright-raindrop-8ca2f6.netlify.app",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("/{*splat}", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/market-chat", marketChatRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: { message: "Not found" } });
});

function isJsonParseError(err) {
  if (!err) return false;
  if (String(err.type || "") === "entity.parse.failed") return true;
  if (err instanceof SyntaxError && (err.statusCode === 400 || err.status === 400) && "body" in err) return true;
  return false;
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const method = String(req.method || "");
  const url = String(req.originalUrl || req.url || "");

  if (isJsonParseError(err)) {
    console.warn(
      `[server] Invalid JSON body (${method} ${url}). Ensure Content-Type: application/json and valid JSON.`,
    );
    return res.status(400).json({
      error: { message: 'Invalid JSON body. Send "Content-Type: application/json" and valid JSON.' },
    });
  }

  console.error(`[server] Unhandled error (${method} ${url}):`, {
    code: err?.code,
    status: err?.statusCode ?? err?.status,
    message: err?.message,
  });
  console.error(err?.stack || err);
  return res.status(500).json({ error: { message: "Internal server error" } });
});

async function start() {
  try {
    await initDb();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exitCode = 1;
  }
}

start();
