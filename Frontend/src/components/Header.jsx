import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a",
];

const linkClass = ({ isActive }) =>
  `text-sm transition ${
    isActive ? "text-white" : "text-white/80 hover:text-white"
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  const seq = useRef([]);

  useEffect(() => {
    function onKey(e) {
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join(",") === KONAMI.join(",")) {
        setAdminVisible((v) => !v);
        seq.current = [];
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 relative">
        {/* Left: name */}
        <NavLink
          to="/"
          className="text-sm font-semibold tracking-wide text-white/90 hover:text-white"
        >
          Antonin <span className="text-white">TACCHI</span>
        </NavLink>

        {/* Right: links + burger */}
        <div className="flex items-center gap-4">

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1">
              <span className="h-[2px] w-4 rounded bg-white/80" />
              <span className="h-[2px] w-4 rounded bg-white/80" />
              <span className="h-[2px] w-4 rounded bg-white/80" />
            </div>
          </button>

          {/* Dropdown (works on ALL sizes) */}
          {open && (
            <div className="absolute right-4 top-12 w-48 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="p-2">
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  About
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  Contact
                </NavLink>

                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  Projects
                </NavLink>

                {adminVisible && (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? "bg-[#6b5cff]/20 text-[#9d91ff]"
                            : "text-[#9d91ff]/70 hover:bg-[#6b5cff]/10 hover:text-[#9d91ff]"
                        }`
                      }
                      onClick={() => setOpen(false)}
                    >
                      ⚙ Admin
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}