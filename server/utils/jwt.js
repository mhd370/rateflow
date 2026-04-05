const jwt = require("jsonwebtoken");

function requireJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  if (!secret) {
    const err = new Error("Missing JWT_SECRET (set it in server/.env).");
    err.code = "JWT_SECRET_MISSING";
    throw err;
  }
  return secret;
}

function signJwt(payload, { expiresIn = "1h" } = {}) {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn });
}

function verifyJwt(token) {
  return jwt.verify(token, requireJwtSecret());
}

module.exports = {
  signJwt,
  verifyJwt,
};

