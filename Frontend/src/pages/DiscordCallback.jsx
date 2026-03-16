import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // ticketNumber

    if (!code) {
      navigate("/contact?discord_error=no_code", { replace: true });
      return;
    }

    const redirectUri = `${window.location.origin}/auth/discord/callback`;

    fetch(`${API_URL}/api/discord/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri, state }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.joined) {
          const params = new URLSearchParams({ discord_joined: "1" });
          if (state) params.set("ticket", state);
          navigate(`/contact?${params}`, { replace: true });
        } else {
          navigate("/contact?discord_error=1", { replace: true });
        }
      })
      .catch(() => {
        navigate("/contact?discord_error=1", { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-[#5865F2] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Connexion à Discord…</p>
          </>
        )}
      </div>
    </div>
  );
}
