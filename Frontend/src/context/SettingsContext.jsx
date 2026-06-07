import { createContext, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    discord: "", github: "", email: "", marketplace: "", tiktok: "", youtube: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSettings(d); })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
