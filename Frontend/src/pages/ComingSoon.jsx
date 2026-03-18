import { Link } from "react-router-dom";
import heroImg from "../img/HeroPortfolio.webp";

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080b12]">
      {/* Background image with heavy overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080b12]/60 via-transparent to-[#080b12]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        {/* Logo / badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6b5cff]/30 bg-[#6b5cff]/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#a89fff] mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6b5cff] animate-pulse" />
          Coming Soon
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_8px_34px_rgba(0,0,0,0.6)]">
          Antonin{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6b5cff] to-[#a89fff]">
            TACCHI
          </span>
        </h1>

        <p className="mt-4 text-lg text-white/50 font-medium">
          FiveM Mapper & Developer
        </p>

        <p className="mt-6 text-white/35 text-sm leading-relaxed max-w-md mx-auto">
          Le portfolio est en cours de construction.
          De nouveaux projets arrivent bientôt.
          <br />
          <span className="text-white/20">The portfolio is under construction. New projects coming soon.</span>
        </p>

        {/* Divider */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-white/10" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#6b5cff]/60" />
          <div className="h-px w-16 bg-white/10" />
        </div>

        {/* Admin link — discret */}
        <div className="mt-10">
          <Link
            to="/admin/login"
            className="text-xs text-white/15 hover:text-white/35 transition"
          >
            Administration
          </Link>
        </div>
      </div>
    </div>
  );
}
