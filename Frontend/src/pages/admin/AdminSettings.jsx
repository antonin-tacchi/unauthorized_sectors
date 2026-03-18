import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const FIELDS = [
  { key: "discord",     label: "Discord",      placeholder: "https://discord.gg/xxx",           icon: "💬" },
  { key: "github",      label: "GitHub",       placeholder: "https://github.com/username",      icon: "🐙" },
  { key: "email",       label: "Email",        placeholder: "contact@example.com",              icon: "✉️" },
  { key: "marketplace", label: "Marketplace",  placeholder: "https://store.example.com",        icon: "🛍️" },
  { key: "tiktok",      label: "TikTok",       placeholder: "https://tiktok.com/@username",     icon: "🎵" },
  { key: "youtube",     label: "YouTube",      placeholder: "https://youtube.com/@username",    icon: "▶️" },
];

const inputCls = "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition";

export default function AdminSettings() {
  const { token } = useAuth();
  const [form, setForm] = useState({ discord: "", github: "", email: "", marketplace: "", tiktok: "", youtube: "", maintenanceMode: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.json())
      .then((d) => setForm({ discord: d.discord || "", github: d.github || "", email: d.email || "", marketplace: d.marketplace || "", tiktok: d.tiktok || "", youtube: d.youtube || "", maintenanceMode: !!d.maintenanceMode }))
      .catch(() => {});
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white/90">Site Settings</h1>
        <p className="mt-1 text-sm text-white/35">Social links displayed in the footer — leave blank to hide.</p>
      </div>

      {/* Maintenance Mode toggle */}
      <div className="mb-8 rounded-xl border border-white/8 bg-white/3 px-5 py-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white/90">Mode maintenance</div>
          <div className="text-xs text-white/35 mt-0.5">
            {form.maintenanceMode
              ? "🔴 Site fermé aux visiteurs — seuls les admins connectés peuvent accéder au site"
              : "🟢 Site ouvert au public"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, maintenanceMode: !f.maintenanceMode }))}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
            form.maintenanceMode ? "bg-[#6b5cff]" : "bg-white/15",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200",
              form.maintenanceMode ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/6 overflow-hidden">
          {FIELDS.map(({ key, label, placeholder, icon }) => (
            <div key={key} className="flex items-center gap-4 px-5 py-4">
              <span className="text-xl w-7 text-center shrink-0" title={label}>{icon}</span>
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/35 mb-1">
                  {label}
                </label>
                <input
                  type={key === "email" ? "email" : "url"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
              {form[key] && (
                <a
                  href={key === "email" ? `mailto:${form[key]}` : form[key]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#6b5cff]/60 hover:text-[#a89fff] transition whitespace-nowrap"
                >
                  Preview ↗
                </a>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#6b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
          >
            {saved ? "✓ Saved" : saving ? "Saving…" : "Save changes"}
          </button>
          <p className="text-xs text-white/25">Changes are reflected immediately in the footer.</p>
        </div>
      </form>
    </div>
  );
}
