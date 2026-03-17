import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a",
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [konamiVisible, setKonamiVisible] = useState(false);
  const { token } = useAuth();
  const seq = useRef([]);
  const location = useLocation();

  const NAV_LINKS = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/projects", label: t("nav.projects") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  useEffect(() => { setOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { setOpen(false); return; }
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join(",") === KONAMI.join(",")) {
        setKonamiVisible((v) => !v);
        seq.current = [];
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showAdmin = token || konamiVisible;

  function toggleLang() {
    const next = i18n.language.startsWith("fr") ? "en" : "fr";
    i18n.changeLanguage(next);
  }

  const isFR = i18n.language.startsWith("fr");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition">
            Antonin <span className="text-white">TACCHI</span>
          </NavLink>

          <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-[60] inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <div className="w-6 h-5.5 gap-1 flex flex-col justify-between">
              <span className={`h-[4px] w-full rounded bg-white/80 transition-all duration-300 origin-center ${open ? "translate-y-[8px] rotate-45" : ""}`} />
              <span className={`h-[4px] w-full rounded bg-white/80 transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`h-[4px] w-full rounded bg-white/80 transition-all duration-300 origin-center ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
            </div>
          </button>
          </div>
        </div>
      </header>

      {/* Fullscreen overlay */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

        {/* Side panel — full height, slides in from the right */}
        <div className={`absolute right-0 top-0 bottom-0 w-72 bg-zinc-950 border-l border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Header of panel */}
          <div className="flex items-center justify-between px-6 h-12 border-b border-white/8 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/30">{t("nav.menu")}</span>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/8 transition text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-4 gap-1">
            {NAV_LINKS.map(({ to, label, end }, i) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={{ transitionDelay: open ? `${i * 180}ms` : "0ms" }}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition-all duration-200 ${
                    open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  } ${
                    isActive
                      ? "bg-white/8 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {label}
                <span className="text-white/20 group-hover:text-white/50 transition text-sm">→</span>
              </NavLink>
            ))}

            {showAdmin && (
              <>
                <div className="my-2 mx-4 border-t border-white/8" />
                <NavLink
                  to="/admin"
                  style={{ transitionDelay: open ? `${NAV_LINKS.length * 180}ms` : "0ms" }}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition-all duration-200 ${
                      open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    } ${
                      isActive
                        ? "bg-[#6b5cff]/15 text-[#a89fff]"
                        : "text-[#a89fff]/40 hover:bg-[#6b5cff]/8 hover:text-[#a89fff]"
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-sm">⚙</span>
                    {t("nav.admin")}
                  </span>
                  <span className="text-[#6b5cff]/30 group-hover:text-[#6b5cff]/60 transition text-sm">→</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer of panel */}
          <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
            <p className="text-xs text-white/20">Antonin TACCHI · FiveM Mapper</p>

            {/* Language selector */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition"
              title={isFR ? "Switch to English" : "Passer en français"}
            >
              <span className={isFR ? "text-white/80" : "text-white/30"}>FR</span>
              <span className="text-white/20">|</span>
              <span className={isFR ? "text-white/30" : "text-white/80"}>EN</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
