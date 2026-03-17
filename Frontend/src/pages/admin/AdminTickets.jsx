import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const STATUS_OPTIONS = ["open", "in-progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const STATUS_COLORS = {
  open:        "text-[#a89fff] bg-[#6b5cff]/15 border-[#6b5cff]/30",
  "in-progress": "text-amber-300 bg-amber-500/10 border-amber-500/30",
  resolved:    "text-green-400 bg-green-500/10 border-green-500/30",
  closed:      "text-white/40 bg-white/5 border-white/10",
};

const PRIORITY_COLORS = {
  low:    "text-green-400",
  medium: "text-amber-300",
  high:   "text-red-400",
};

function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-1">{label}</div>
      <div className={`text-2xl font-extrabold ${color ?? "text-white/90"}`}>{value ?? 0}</div>
    </div>
  );
}

export default function AdminTickets() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Multi-select state
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Panel state
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("low");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const LIMIT = 15;

  const load = useCallback(async ({ silent = false, syncSelectedId = null } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      const res = await fetch(`${API_URL}/api/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets);
      setTotal(data.total);
      setStatusCounts(data.statusCounts ?? {});
      if (syncSelectedId) {
        const refreshed = data.tickets.find((t) => t._id === syncSelectedId);
        if (refreshed) {
          setSelected(refreshed);
          setNewStatus(refreshed.status);
          setNewPriority(refreshed.priority || "low");
          setAdminNotes(refreshed.adminNotes || "");
        }
      }
    } catch {
      if (!silent) setTickets([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, page, filterStatus, filterPriority]);

  useEffect(() => { load(); }, [load]);

  // Clear checked when page/filters change
  useEffect(() => { setCheckedIds(new Set()); }, [page, filterStatus, filterPriority]);

  async function openDetail(ticket) {
    setSelected(ticket);
    setNewStatus(ticket.status);
    setNewPriority(ticket.priority || "low");
    setAdminNotes(ticket.adminNotes || "");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/tickets/${selected._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, priority: newPriority, adminNotes }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      load({ silent: true, syncSelectedId: updated._id });
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this ticket?")) return;
    await fetch(`${API_URL}/api/tickets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (selected?._id === id) setSelected(null);
    setCheckedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    load();
  }

  async function handleBulkDelete() {
    if (checkedIds.size === 0) return;
    if (!confirm(`Supprimer ${checkedIds.size} ticket(s) ? Les channels Discord associés seront aussi supprimés.`)) return;
    setBulkDeleting(true);
    try {
      await fetch(`${API_URL}/api/tickets/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...checkedIds] }),
      });
      if (selected && checkedIds.has(selected._id)) setSelected(null);
      setCheckedIds(new Set());
      load();
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleCheck(id, e) {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll(e) {
    e.stopPropagation();
    if (checkedIds.size === tickets.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(tickets.map((t) => t._id)));
    }
  }

  const allChecked = tickets.length > 0 && checkedIds.size === tickets.length;
  const someChecked = checkedIds.size > 0 && !allChecked;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white/90">Tickets</h1>
        <p className="mt-1 text-sm text-white/35">Manage contact requests</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open"        value={statusCounts.open}          color="text-[#a89fff]" />
        <StatCard label="In progress" value={statusCounts["in-progress"]} color="text-amber-300" />
        <StatCard label="Resolved"    value={statusCounts.resolved}       color="text-green-400" />
        <StatCard label="Closed"      value={statusCounts.closed}         color="text-white/40" />
      </div>

      {/* Filters + bulk action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 outline-none focus:border-[#6b5cff]/60 transition"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0f1117] capitalize">{s}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 outline-none focus:border-[#6b5cff]/60 transition"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p} className="bg-[#0f1117] capitalize">{p}</option>)}
        </select>
        {(filterStatus || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterPriority(""); setPage(1); }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/50 hover:text-white/80 transition"
          >
            Clear
          </button>
        )}

        {/* Bulk delete bar — shown when items are checked */}
        {checkedIds.size > 0 && (
          <div className="ml-auto flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-1.5">
            <span className="text-sm text-white/60">{checkedIds.size} sélectionné{checkedIds.size > 1 ? "s" : ""}</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-md bg-red-500/80 hover:bg-red-500 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              {bulkDeleting ? "Suppression…" : "Supprimer"}
            </button>
            <button
              onClick={() => setCheckedIds(new Set())}
              className="text-white/30 hover:text-white/60 transition text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-4 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      className="accent-[#6b5cff] cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-widest">Ticket</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-widest">Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-widest hidden md:table-cell">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-widest hidden lg:table-cell">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-white/8 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                      No tickets found.
                    </td>
                  </tr>
                ) : tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => openDetail(t)}
                    className={`border-b border-white/5 cursor-pointer transition hover:bg-white/3 ${selected?._id === t._id ? "bg-white/4" : ""} ${checkedIds.has(t._id) ? "bg-[#6b5cff]/5" : ""}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(t._id)}
                        onChange={(e) => toggleCheck(t._id, e)}
                        className="accent-[#6b5cff] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#a89fff]">{t.ticketNumber}</td>
                    <td className="px-4 py-3 text-white/75 max-w-[160px] truncate">{t.subject}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[t.priority] ?? "text-white/50"}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[t.status] ?? ""}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-white/35 text-xs hidden lg:table-cell">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                        className="text-white/25 hover:text-red-400 transition text-base"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 transition"
              >
                ← Prev
              </button>
              <span className="text-xs text-white/35">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col gap-4 self-start">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#a89fff]">{selected.ticketNumber}</span>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60 transition">✕</button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/35">Subject</span>
              <span className="text-sm text-white/80">{selected.subject}</span>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/35">Submitted</span>
                <span className="text-sm text-white/60">{new Date(selected.createdAt).toLocaleDateString()}</span>
              </div>
              {selected.budget && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/35">Budget</span>
                  <span className="text-sm text-white/70">{selected.budget}</span>
                </div>
              )}
              {selected.timeline && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/35">Délai</span>
                  <span className="text-sm text-white/70">{selected.timeline}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/35">Contact</span>
              <span className="text-sm text-white/75">{selected.email}</span>
              {selected.discord && <span className="text-xs text-white/45">{selected.discord}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/35">Message</span>
              <p className="text-sm text-white/65 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {selected.message}
              </p>
            </div>

            <hr className="border-white/8" />

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/35">Priorité</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[#6b5cff]/60 transition"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#0f1117] capitalize">{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/35">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[#6b5cff]/60 transition"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#0f1117] capitalize">{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/35">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes…"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-[#6b5cff]/60 resize-none transition"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#6b5cff] py-2 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>

            <button
              onClick={() => handleDelete(selected._id)}
              className="rounded-lg border border-red-500/20 py-2 text-sm font-semibold text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition"
            >
              Delete ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
