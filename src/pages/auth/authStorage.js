export const AUTH_TOKEN_KEY = "rateflow_auth_token";
export const AUTH_USER_KEY = "rateflow_auth_user";

export function saveAuth({ token, user } = {}) {
  if (typeof token === "string" && token.trim()) {
    localStorage.setItem(AUTH_TOKEN_KEY, token.trim());
  }
  if (user && typeof user === "object") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function getAuthToken() {
  return String(localStorage.getItem(AUTH_TOKEN_KEY) || "");
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
