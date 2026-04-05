const bcrypt = require("bcrypt");

function bcryptRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS);
  return Number.isFinite(rounds) && rounds >= 10 ? Math.floor(rounds) : 12;
}

async function hashPassword(password) {
  const value = String(password || "");
  return bcrypt.hash(value, bcryptRounds());
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(String(password || ""), String(passwordHash || ""));
}

module.exports = {
  hashPassword,
  comparePassword,
};

