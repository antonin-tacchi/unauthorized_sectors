import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminTags() {
  const { token } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/filters/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTags(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(tag) {
    if (!window.confirm(`Remove tag "${tag}" from all projects?`)) return;
    setDeleting(tag);
    try {
      await fetch(`${API_URL}/api/filters/tags/${encodeURIComponent(tag)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } finally {
      setDeleting(null);
    }
  }

  const filtered = tags.filter((t) =>
    t.tag.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white/90">Tags</h1>
        <p className="mt-1 text-sm text-white/35">{tags.length} unique tag{tags.length !== 1 ? "s" : ""} across all projects</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tags…"
        className="w-full mb-6 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/8 bg-white/3">
              <tr>
                <th className="text-left px-4 py-3 text-white/40 font-medium">Tag</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium">Projects</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.tag} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"}`}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[#6b5cff]/15 border border-[#6b5cff]/20 px-3 py-0.5 text-xs font-medium text-[#a89fff]">
                      {t.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40">{t.count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t.tag)}
                      disabled={deleting === t.tag}
                      className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
                    >
                      {deleting === t.tag ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-white/25">
                    No tags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
