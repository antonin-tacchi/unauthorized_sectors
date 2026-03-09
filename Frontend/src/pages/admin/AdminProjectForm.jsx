import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY = {
  title: "",
  shortDesc: "",
  description: "",
  image: "",
  mappingType: "",
  style: "",
  size: "",
  performance: "",
  status: "published",
  tags: "",
  "pricing.cents": "",
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-white/35 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition";

const selectCls =
  "w-full rounded-lg bg-[#0f1420] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition";

export default function AdminProjectForm() {
  const { id } = useParams(); // undefined = new
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/id/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setForm({
          title: data.title || "",
          shortDesc: data.shortDesc || "",
          description: data.description || "",
          image: data.image || "",
          mappingType: data.mappingType || "",
          style: data.style || "",
          size: data.size || "",
          performance: data.performance || "",
          status: data.status || "published",
          tags: (data.tags || []).join(", "),
          "pricing.cents": data.pricing?.cents ? String(data.pricing.cents) : "",
        });
      } catch {
        setError("Failed to load project.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, token]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title: form.title,
      shortDesc: form.shortDesc,
      description: form.description,
      image: form.image,
      mappingType: form.mappingType,
      style: form.style,
      size: form.size,
      performance: form.performance,
      status: form.status,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      pricing: {
        cents: parseInt(form["pricing.cents"] || "0", 10) || 0,
      },
    };

    try {
      const url = isEdit
        ? `${API_URL}/api/projects/${id}`
        : `${API_URL}/api/projects`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      navigate("/admin/projects");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-white/35 animate-pulse">Loading…</div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white/90">
          {isEdit ? "Edit project" : "New project"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title *">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Short description">
          <input
            value={form.shortDesc}
            onChange={(e) => set("shortDesc", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls + " resize-y"}
          />
        </Field>

        <Field label="Cover image URL">
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            className={inputCls}
            placeholder="https://…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mapping type">
            <select value={form.mappingType} onChange={(e) => set("mappingType", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {["mlo","interior","exterior","ymap","ytyp","custom-props","addon-map","rework"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Style">
            <select value={form.style} onChange={(e) => set("style", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {["modern","classic","cyber"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Size">
            <select value={form.size} onChange={(e) => set("size", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {["small","medium","massive"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Performance">
            <select value={form.performance} onChange={(e) => set("performance", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {["optimized","balanced","heavy"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        <Field label="Tags (comma-separated)">
          <input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="fivem, mlo, popular"
            className={inputCls}
          />
        </Field>

        <Field label="Price (cents, 0 = free)">
          <input
            type="number"
            min="0"
            value={form["pricing.cents"]}
            onChange={(e) => set("pricing.cents", e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#6b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/projects")}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
