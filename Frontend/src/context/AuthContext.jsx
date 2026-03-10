import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const AuthContext = createContext(null);

// Access token stocké en mémoire uniquement (pas localStorage/sessionStorage)
let _accessToken = null;

export function getAccessToken() { return _accessToken; }

async function callRefresh() {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include", // envoie le cookie httpOnly
  });
  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  _accessToken = data.token;
  return data.token;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  function scheduleRefresh(delayMs) {
    clearTimeout(refreshTimerRef.current);
    // Rafraîchit 1 minute avant expiration
    const delay = Math.max(delayMs - 60_000, 10_000);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const newToken = await callRefresh();
        setToken(newToken);
        scheduleRefresh(14 * 60 * 1000); // re-planifie pour 14 min
      } catch {
        setToken(null);
        setAdmin(null);
        _accessToken = null;
      }
    }, delay);
  }

  async function fetchMe(t) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      setAdmin(await res.json());
    } catch {
      setToken(null);
      setAdmin(null);
      _accessToken = null;
    } finally {
      setLoading(false);
    }
  }

  // Au montage : tenter un refresh silencieux (cookie persisté)
  useEffect(() => {
    (async () => {
      try {
        const newToken = await callRefresh();
        setToken(newToken);
        await fetchMe(newToken);
        scheduleRefresh(14 * 60 * 1000);
      } catch {
        setLoading(false);
      }
    })();
    return () => clearTimeout(refreshTimerRef.current);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    _accessToken = data.token;
    setToken(data.token);
    await fetchMe(data.token);
    scheduleRefresh(14 * 60 * 1000);
  }, []);

  const logout = useCallback(async () => {
    clearTimeout(refreshTimerRef.current);
    _accessToken = null;
    setToken(null);
    setAdmin(null);
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
