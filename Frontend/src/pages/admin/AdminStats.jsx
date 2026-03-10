import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

function StatCard({ label, value, sub, color = "#6b5cff" }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0f1420] p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">{label}</div>
      <div className="text-3xl font-extrabold" style={{ color }}>{value ?? "—"}</div>
      {sub && <div className="mt-1 text-xs text-white/35">{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-xs text-white/80">
      <div className="text-white/40 mb-1">{label}</div>
      <div><span className="text-[#6b5cff] font-semibold">{payload[0].value}</span> views</div>
    </div>
  );
}

export default function AdminStats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load stats");
        setData(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return (
    <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-8 text-red-400 text-sm">{error}</div>
  );

  const maxViews = Math.max(...(data.top5.map((p) => p.views)), 1);

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <h1 className="text-2xl font-extrabold text-white/90">Statistics</h1>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total views"      value={data.totalViews.toLocaleString()}    color="#6b5cff" />
        <StatCard label="Published"        value={data.totalProjects}                  color="#22c55e" />
        <StatCard label="Added this month" value={data.addedThisMonth}                 color="#f59e0b" />
        <StatCard label="Total favorites"  value={data.totalFavorites.toLocaleString()} color="#ef4444" />
      </div>

      {/* Top 5 */}
      <div className="rounded-xl border border-white/8 bg-[#0f1420] p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Top 5 most viewed</div>
        <div className="space-y-3">
          {data.top5.length === 0 && (
            <p className="text-white/30 text-sm italic">No data yet.</p>
          )}
          {data.top5.map((p, i) => (
            <div key={p._id} className="flex items-center gap-3">
              <span className="text-xs text-white/25 w-4 text-right">{i + 1}</span>
              <Link to={`/projects/${p.slug}`} className="flex-1 text-sm text-white/80 truncate hover:text-white transition">
                {p.title}
              </Link>
              <span className="text-xs text-white/40 w-16 text-right">{p.views.toLocaleString()} views</span>
              <div className="w-32 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6b5cff]"
                  style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {data.dailyViews.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#0f1420] p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
            Views activity (last 30 days — projects created)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyViews} barSize={12}>
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                tickFormatter={(d) => d.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                {data.dailyViews.map((_, i) => (
                  <Cell key={i} fill={i === data.dailyViews.length - 1 ? "#6b5cff" : "rgba(107,92,255,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
