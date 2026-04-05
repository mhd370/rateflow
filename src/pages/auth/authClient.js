import i18n from "../../i18n";

const DEFAULT_DEV_API_BASE = "http://localhost:4000";

function normalizeBaseUrl(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  return v.replace(/\/+$/, "");
}

let didLogAuthClientConfig = false;

function debugLog(...args) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

function debugError(...args) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.error(...args);
}

export function getApiBaseUrl() {
  const envBase = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
  const isDev = process.env.NODE_ENV === "development";

  // In development, prefer same-origin API calls (CRA proxy) to avoid CORS/mixed-content issues.
  // If an explicit non-default API base is provided, use it as-is.
  const resolvedBase = isDev
    ? envBase && envBase !== DEFAULT_DEV_API_BASE
      ? envBase
      : ""
    : envBase || "";

  if (!didLogAuthClientConfig) {
    didLogAuthClientConfig = true;
    debugLog("[authClient] API config", {
      nodeEnv: process.env.NODE_ENV,
      envBase,
      resolvedBase: resolvedBase || "(same-origin via CRA proxy)",
      browserOrigin: typeof window !== "undefined" ? window.location.origin : "(no window)",
    });
  }

  return resolvedBase;
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestJson(path, { method = "GET", body, signal } = {}) {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  debugLog(`[authClient] request ${method} ${url}`);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    debugError("[authClient] fetch failed", {
      method,
      url,
      base,
      path,
      nodeEnv: process.env.NODE_ENV,
      envBase: String(process.env.REACT_APP_API_BASE_URL || ""),
      browserOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
      errorMessage: String(err?.message || err),
    });
    const e = new Error(
      i18n.t("auth.networkError", "Network error. Is the backend running?"),
    );
    e.code = "NETWORK_ERROR";
    throw e;
  }

  const data = await readJson(res);

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `Request failed (${res.status}).`;
    const e = new Error(msg);
    e.code = data?.error?.code || "REQUEST_FAILED";
    e.status = res.status;
    throw e;
  }

  return data;
}

export function registerUser({ name, email, password, signal } = {}) {
  return requestJson("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
    signal,
  });
}

export function loginUser({ email, password, signal } = {}) {
  return requestJson("/api/auth/login", {
    method: "POST",
    body: { email, password },
    signal,
  });
}

export function getCurrentUser({ token, signal } = {}) {
  const jwt = String(token || "").trim();
  if (!jwt) {
    const e = new Error(i18n.t("auth.missingToken", "Missing auth token."));
    e.code = "AUTH_MISSING";
    throw e;
  }

  const base = getApiBaseUrl();
  const url = base ? `${base}/api/auth/me` : "/api/auth/me";

  return (async () => {
    let res;
    try {
      debugLog(`[authClient] request GET ${url}`);
      res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
          accept: "application/json",
        },
        signal,
      });
    } catch (err) {
      debugError("[authClient] fetch failed", {
        method: "GET",
        url,
        base,
        path: "/api/auth/me",
        nodeEnv: process.env.NODE_ENV,
        envBase: String(process.env.REACT_APP_API_BASE_URL || ""),
        browserOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        errorMessage: String(err?.message || err),
      });
      const e = new Error(
        i18n.t("auth.networkError", "Network error. Is the backend running?"),
      );
      e.code = "NETWORK_ERROR";
      throw e;
    }

    const data = await readJson(res);
    if (!res.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Request failed (${res.status}).`;
      const e = new Error(msg);
      e.code = data?.error?.code || "REQUEST_FAILED";
      e.status = res.status;
      throw e;
    }

    return data;
  })();
}
