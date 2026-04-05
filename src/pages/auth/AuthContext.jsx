import * as React from "react";

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearAuth,
  getAuthToken,
  getAuthUser,
  saveAuth,
} from "./authStorage";
import { getCurrentUser } from "./authClient";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getAuthToken());
  const [user, setUser] = React.useState(() => getAuthUser());
  const [authLoading, setAuthLoading] = React.useState(() => Boolean(getAuthToken()));
  const [sessionValidated, setSessionValidated] = React.useState(false);

  const isAuthenticated = Boolean(String(token || "").trim()) && sessionValidated;

  const setSession = React.useCallback(({ token: nextToken, user: nextUser } = {}) => {
    saveAuth({ token: nextToken, user: nextUser });
    setToken(String(nextToken || ""));
    setUser(nextUser || null);
    setSessionValidated(Boolean(String(nextToken || "").trim()));
  }, []);

  const logout = React.useCallback(() => {
    clearAuth();
    setToken("");
    setUser(null);
    setSessionValidated(false);
  }, []);

  React.useEffect(() => {
    const existingToken = String(getAuthToken() || "").trim();
    if (!existingToken) {
      setAuthLoading(false);
      setSessionValidated(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function validate() {
      setAuthLoading(true);
      try {
        const data = await getCurrentUser({ token: existingToken, signal: controller.signal });
        if (!active) return;

        const freshUser = data?.user || null;
        if (!freshUser?.id) {
          throw new Error("Invalid /me response.");
        }

        saveAuth({ token: existingToken, user: freshUser });
        setToken(existingToken);
        setUser(freshUser);
        setSessionValidated(true);
      } catch (err) {
        if (!active) return;

        console.warn("[auth] Session validation failed; clearing session.", {
          code: err?.code,
          status: err?.status,
          message: err?.message,
        });

        clearAuth();
        setToken("");
        setUser(null);
        setSessionValidated(false);
      } finally {
        if (!active) return;
        setAuthLoading(false);
      }
    }

    validate();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  React.useEffect(() => {
    function onStorage(e) {
      if (!e) return;
      if (e.key !== AUTH_TOKEN_KEY && e.key !== AUTH_USER_KEY) return;
      setToken(getAuthToken());
      setUser(getAuthUser());
      setSessionValidated(Boolean(String(getAuthToken() || "").trim()));
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = React.useMemo(() => {
    return {
      token,
      user,
      isAuthenticated,
      authLoading,
      setSession,
      logout,
    };
  }, [token, user, isAuthenticated, authLoading, setSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
