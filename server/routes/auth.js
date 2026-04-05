const express = require("express");

const { getDb, get, run } = require("../db");
const { hashPassword, comparePassword } = require("../utils/password");
const { signJwt } = require("../utils/jwt");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = String(value || "");
  if (!email) return false;
  if (email.length > 254) return false;
  // Simple, pragmatic email check (avoid overly strict regex).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

function jsonError(res, status, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      ...extra,
    },
  });
}

function isSqliteUniqueEmailError(err) {
  const msg = String(err?.message || "");
  return msg.includes("SQLITE_CONSTRAINT") && msg.toLowerCase().includes("users.email");
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!password) missing.push("password");

    if (missing.length) {
      return jsonError(res, 400, "MISSING_FIELDS", "Missing required fields.", { fields: missing });
    }

    if (!isValidEmail(email)) {
      return jsonError(res, 400, "INVALID_EMAIL", "Please provide a valid email address.");
    }

    if (password.length < 8) {
      return jsonError(res, 400, "WEAK_PASSWORD", "Password must be at least 8 characters.");
    }

    const db = getDb();

    const existing = await get(db, "SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing?.id) {
      return jsonError(res, 409, "EMAIL_TAKEN", "An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);

    const stmt = await run(
      db,
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash],
    );

    const userRow = await get(
      db,
      "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1",
      [stmt?.lastID],
    );

    const user = safeUser(userRow);
    if (!user) {
      return jsonError(res, 500, "SERVER_ERROR", "Failed to create user.");
    }

    const token = signJwt({ userId: user.id, email: user.email }, { expiresIn: "7d" });

    return res.status(201).json({
      ok: true,
      token,
      user,
    });
  } catch (err) {
    if (isSqliteUniqueEmailError(err)) {
      return jsonError(res, 409, "EMAIL_TAKEN", "An account with this email already exists.");
    }

    console.error("[auth] register failed:", err);
    return jsonError(res, 500, "SERVER_ERROR", "Internal server error.");
  }
});

router.post("/login", async (req, res) => {
  let step = "start";
  let emailForLog = "";
  try {
    step = "read_body";
    const email = normalizeEmail(req.body?.email);
    emailForLog = email;
    const password = String(req.body?.password || "");

    step = "validate_fields";
    const missing = [];
    if (!email) missing.push("email");
    if (!password) missing.push("password");

    if (missing.length) {
      return jsonError(res, 400, "MISSING_FIELDS", "Missing required fields.", { fields: missing });
    }

    step = "validate_email";
    if (!isValidEmail(email)) {
      return jsonError(res, 400, "INVALID_EMAIL", "Please provide a valid email address.");
    }

    step = "db_get";
    const db = getDb();
    step = "db_user_lookup";
    const userRow = await get(
      db,
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (!userRow?.id) {
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    step = "bcrypt_compare";
    const ok = await comparePassword(password, userRow.password_hash);
    if (!ok) {
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const user = safeUser(userRow);
    step = "jwt_sign";
    const token = signJwt({ userId: user.id, email: user.email }, { expiresIn: "7d" });

    return res.json({
      ok: true,
      token,
      user,
    });
  } catch (err) {
    console.error(`[auth] login failed (step=${step}):`, { email: emailForLog, code: err?.code });
    console.error(err?.stack || err);
    return jsonError(res, 500, "SERVER_ERROR", "Internal server error.");
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userIdRaw = req.user?.userId ?? req.user?.id;
    const userId = Number(userIdRaw);

    if (!Number.isFinite(userId) || userId <= 0) {
      return jsonError(res, 401, "AUTH_INVALID", "Invalid token payload.");
    }

    const db = getDb();
    const userRow = await get(
      db,
      "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (!userRow?.id) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }

    return res.json({ ok: true, user: safeUser(userRow) });
  } catch (err) {
    console.error("[auth] me failed:", err);
    return jsonError(res, 500, "SERVER_ERROR", "Internal server error.");
  }
});

module.exports = router;
