import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { key: "mappingTypes", label: "Mapping Types" },
  { key: "styles",       label: "Styles" },
  { key: "sizes",        label: "Sizes" },
  { key: "performances", label: "Performances" },
];

function TagPill({ value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-sm text-white/70">
      {value}
      <button
        onClick={() => onRemove(value)}
        className="text-white/30 hover:text-red-400 transition text-xs leading-none"
      >
        ✕
      </button>
    </span>
  );
}

export default function AdminFilters() {
  const { token } = useAuth();
  const [filters, setFilters] = useState(null);
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/filters`)
      .then((r) => r.json())
      .then((d) => {
        setFilters(d);
        setInputs(Object.fromEntries(CATEGORIES.map(({ key }) => [key, ""])));
      });
  }, []);

  function addValue(key) {
    const val = inputs[key]?.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || filters[key]?.includes(val)) return;
    setFilters((f) => ({ ...f, [key]: [...(f[key] || []), val] }));
    setInputs((i) => ({ ...i, [key]: "" }));
  }

  function removeValue(key, val) {
    setFilters((f) => ({ ...f, [key]: f[key].filter((v) => v !== val) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_URL}/api/filters`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(filters),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!filters) return <div className="p-8 text-white/30 animate-pulse">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white/90">Filters</h1>
          <p className="mt-1 text-sm text-white/35">Manage dropdown filter options</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#6b5cff] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
        >
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-white/8 bg-white/3 p-5">
            <div className="text-sm font-semibold text-white/60 mb-4">{label}</div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(filters[key] || []).map((v) => (
                <TagPill key={v} value={v} onRemove={(val) => removeValue(key, val)} />
              ))}
              {filters[key]?.length === 0 && (
                <span className="text-xs text-white/25">No values yet</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={inputs[key] || ""}
                onChange={(e) => setInputs((i) => ({ ...i, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue(key))}
                placeholder="Add value…"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition"
              />
              <button
                onClick={() => addValue(key)}
                className="rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/12 transition"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
