import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminProjects() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const limit = 15;

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/projects?page=${p}&limit=${limit}&sort=new`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    setDeleting(project._id);
    // Optimistic update — retire immédiatement de la liste
    setItems((prev) => prev.filter((p) => p._id !== project._id));
    setTotal((prev) => prev - 1);
    try {
      const res = await fetch(`${API_URL}/api/projects/${project._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`"${project.title}" deleted`);
    } catch (err) {
      toast.error(err.message || "Delete failed");
      // Revert en cas d'erreur
      await load(page);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white/90">Projects</h1>
          <p className="mt-1 text-sm text-white/35">{total} project{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          to="/admin/projects/new"
          className="rounded-lg bg-[#6b5cff] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
        >
          + New project
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-white/8 bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8 bg-white/3">
                <tr>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden lg:table-cell">Views</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p._id}
                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"}`}
                  >
                    <td className="px-4 py-3 text-white/80 font-medium truncate max-w-[200px]">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-white/45 capitalize hidden md:table-cell">
                      {p.mappingType || "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "published"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-white/8 text-white/40"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/35 hidden lg:table-cell">
                      {p.views ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/admin/projects/${p._id}/edit`)}
                          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p._id}
                          className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
                        >
                          {deleting === p._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition"
            >
              Prev
            </button>
            <span className="text-white/35">Page {page} / {totalPages}</span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
