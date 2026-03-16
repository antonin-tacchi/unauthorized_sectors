import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-2">
        {label}
      </div>
      <div className={`text-3xl font-extrabold ${color ?? "text-white/90"}`}>
        {value ?? <span className="text-white/20">—</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-white/35">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [openTickets, setOpenTickets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, ticketRes] = await Promise.all([
          fetch(`${API_URL}/api/projects/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/tickets?status=open&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (projRes.ok) setStats(await projRes.json());
        if (ticketRes.ok) {
          const td = await ticketRes.json();
          setOpenTickets(td.statusCounts?.open ?? 0);
        }
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const byType = stats?.byMappingType || {};
  const totalViews = stats?.totalViews ?? null;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white/90">Dashboard</h1>
        <p className="mt-1 text-sm text-white/35">Overview of your portfolio</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-white/8 bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Main stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total projects" value={stats?.total ?? 0} />
            <StatCard label="Total views" value={totalViews ?? 0} />
            <StatCard label="MLO" value={byType.mlo ?? 0} />
            <StatCard label="Exterior" value={byType.exterior ?? 0} />
          </div>

          {/* Open tickets */}
          <div className="mt-4">
            <Link to="/admin/tickets">
              <StatCard
                label="Open tickets"
                value={openTickets ?? 0}
                color={openTickets > 0 ? "text-[#a89fff]" : "text-white/90"}
                sub={openTickets > 0 ? "Click to manage" : "No pending tickets"}
              />
            </Link>
          </div>

          {/* By type breakdown */}
          {Object.keys(byType).length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">
                By mapping type
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(byType).map(([type, count]) => (
                  <div
                    key={type}
                    className="rounded-lg border border-white/8 bg-white/3 px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm capitalize text-white/60">{type}</span>
                    <span className="text-sm font-bold text-white/80">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">
              Quick actions
            </h2>
            <div className="flex gap-3">
              <Link
                to="/admin/projects/new"
                className="rounded-lg bg-[#6b5cff] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
              >
                + New project
              </Link>
              <Link
                to="/admin/projects"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 transition"
              >
                Manage projects
              </Link>
              <Link
                to="/admin/tickets"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 transition"
              >
                View tickets
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
