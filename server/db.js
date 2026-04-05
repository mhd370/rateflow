const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let dbInstance = null;

function openDb(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() during server startup.");
  }
  return dbInstance;
}

async function initDb() {
  if (dbInstance) return dbInstance;

  const defaultPath = path.join(__dirname, "data", "rateflow.sqlite");
  const dbPath = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : defaultPath;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = await openDb(dbPath);

  await run(db, "PRAGMA foreign_keys = ON;");
  await run(db, "PRAGMA journal_mode = WAL;");

  await run(
    db,
    `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  );

  dbInstance = db;
  console.log(`[db] ready (${dbPath})`);
  return dbInstance;
}

module.exports = {
  initDb,
  getDb,
  run,
  get,
  all,
};

