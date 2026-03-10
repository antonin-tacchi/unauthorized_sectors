import { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore token from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_token");
    if (stored) {
      setToken(stored);
      fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setAdmin(data);
    } catch {
      setToken(null);
      setAdmin(null);
      sessionStorage.removeItem("admin_token");
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    sessionStorage.setItem("admin_token", data.token);
    setToken(data.token);
    await fetchMe(data.token);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    setAdmin(null);
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
