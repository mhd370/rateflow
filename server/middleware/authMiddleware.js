const { verifyJwt } = require("../utils/jwt");

function authMiddleware(req, res, next) {
  const rawHeader = req.headers.authorization;
  if (!rawHeader) {
    return res.status(401).json({
      ok: false,
      error: { code: "AUTH_MISSING", message: "Missing Authorization header." },
    });
  }

  const header = String(rawHeader || "").trim();
  const parts = header.split(/\s+/).filter(Boolean);
  if (parts.length !== 2) {
    return res.status(401).json({
      ok: false,
      error: {
        code: "AUTH_MALFORMED",
        message: "Malformed Authorization header. Use: Bearer <token>.",
      },
    });
  }

  const [scheme, token] = parts;
  if (String(scheme).toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      ok: false,
      error: {
        code: "AUTH_MALFORMED",
        message: "Malformed Authorization header. Use: Bearer <token>.",
      },
    });
  }

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    return next();
  } catch (err) {
    if (String(err?.code) === "JWT_SECRET_MISSING") {
      return res.status(500).json({
        ok: false,
        error: {
          code: "SERVER_MISCONFIG",
          message: "Server JWT secret is not configured.",
        },
      });
    }

    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: { code: "AUTH_EXPIRED", message: "Token expired." },
      });
    }

    return res.status(401).json({
      ok: false,
      error: { code: "AUTH_INVALID", message: "Invalid token." },
    });
  }
}

module.exports = { authMiddleware };
