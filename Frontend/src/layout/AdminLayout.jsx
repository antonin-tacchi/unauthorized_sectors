import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "⊞", end: true },
  { to: "/admin/projects", label: "Projects", icon: "◫" },
  { to: "/admin/filters", label: "Filters", icon: "⊟" },
  { to: "/admin/tags", label: "Tags", icon: "⊕" },
  { to: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/8 bg-[#0f1420] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="text-sm font-bold text-white/90">Admin Panel</div>
          <div className="text-xs text-white/35 mt-0.5 truncate">{admin?.email}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-[#6b5cff]/20 text-[#a89fff] font-medium"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`
              }
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/8 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white/70 transition"
          >
            <span className="text-base leading-none">←</span>
            Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-red-400 transition"
          >
            <span className="text-base leading-none">⏻</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
