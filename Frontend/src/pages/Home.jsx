import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SafeImage from "../components/SafeImage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import heroImg from "../img/HeroPortfolio.webp";
import mloImg from "../img/MLOPortfolio.jpeg";
import cityImg from "../img/AerialViewGTA.png";
import customImg from "../img/Custom_Project.jpg";
import devImg from "../img/Scipt_Mapping.jpg";

function formatDateFR(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * ✅ Tries to extract a "total count" from whatever shape your API returns
 * Supported examples:
 * - { total: 13, items: [...] }
 * - { count: 13, items: [...] }
 * - { totalItems: 13, items: [...] }
 * - { pagination: { total: 13 } }
 * - { pagination: { totalItems: 13 } }
 * - { meta: { total: 13 } }
 */
function extractTotal(json) {
  if (!json || typeof json !== "object") return null;

  const direct =
    json.total ??
    json.count ??
    json.totalItems ??
    json.total_count ??
    json.totalCount;

  if (Number.isFinite(direct)) return direct;

  const nested =
    json.pagination?.total ??
    json.pagination?.totalItems ??
    json.meta?.total ??
    json.meta?.totalItems;

  if (Number.isFinite(nested)) return nested;

  // fallback: if items exists, use length (not ideal but better than nothing)
  if (Array.isArray(json.items)) return json.items.length;
  if (Array.isArray(json.data)) return json.data.length;

  return null;
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#6b5cff]/90 px-6 py-1.5 text-xs font-semibold tracking-wide text-white shadow-[0_10px_40px_-18px_rgba(107,92,255,0.9)]">
      {children}
    </span>
  );
}

function GlowButton({ children, className = "", ...props }) {
  return (
    <Link
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-full bg-[#6b5cff] px-8 py-3 text-sm font-semibold text-white",
        "shadow-[0_22px_70px_-26px_rgba(107,92,255,0.9)] hover:brightness-110 active:brightness-95 transition",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function CategoryCard({ title, subtitle, img, to, icon, height = 220, countLabel }) {
  return (
    <Link
      to={to}
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-white/5 shadow-[0_38px_120px_-80px_rgba(0,0,0,0.95)]",
      ].join(" ")}
    >
      <SafeImage
        src={img}
        alt={title}
        className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        style={{ height }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      <div className="absolute left-6 top-6 text-[#6b5cff] opacity-95">{icon}</div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.55)]">
          {title}
        </div>
        <div className="mt-1 text-sm text-white/75">{subtitle}</div>

        {/* ✅ dynamic count label */}
        {countLabel ? <div className="mt-3 text-sm text-white/65">{countLabel}</div> : null}
      </div>
    </Link>
  );
}

function NewCard({ title, date, img, to }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
    >
      <SafeImage
        src={img}
        alt={title}
        className="h-[160px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xl font-extrabold text-white drop-shadow">{title}</div>
        <div className="mt-1 text-sm text-white/70">{date}</div>
      </div>
    </Link>
  );
}

function Service({ title, text }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#6b5cff]/20 ring-1 ring-[#6b5cff]/35">
        <div className="flex h-full w-full items-center justify-center text-[#6b5cff]">✓</div>
      </div>
      <div>
        <div className="text-lg font-bold text-white/90">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-white/60">{text}</div>
      </div>
    </div>
  );
}

export default function Home() {
  // ✅ What’s New
  const [latest, setLatest] = useState([]);
  const [latestStatus, setLatestStatus] = useState("loading");

  // ✅ Featured = latest[0] (si dispo) sinon fallback
  const featured = useMemo(() => latest?.[0] || null, [latest]);

  // ✅ Dynamic counts
  const [counts, setCounts] = useState({
    mlo: null,
    exterior: null,
    dev: null,
  });

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLatestStatus("loading");

        // ✅ 1) Latest projects (unchanged spirit: just data fetch)
        const resLatest = await fetch(`${API_URL}/api/projects?sort=new&page=1&limit=3`);
        const jsonLatest = await resLatest.json();
        if (!resLatest.ok) throw new Error(jsonLatest?.message || "API error");

        // ✅ 2) Counts (parallel)
        // Adjust mappingType values to YOUR API filter values if needed.
        // Here: mlo / exterior / rework (dev+mapping) based on your previous links.
        const urls = {
          mlo: `${API_URL}/api/projects?mappingType=mlo&page=1&limit=1`,
          exterior: `${API_URL}/api/projects?mappingType=exterior&page=1&limit=1`,
          dev: `${API_URL}/api/projects?mappingType=rework&page=1&limit=1`,
        };

        const [mloRes, exteriorRes, devRes] = await Promise.all([
          fetch(urls.mlo),
          fetch(urls.exterior),
          fetch(urls.dev),
        ]);

        const [mloJson, exteriorJson, devJson] = await Promise.all([
          mloRes.json().catch(() => ({})),
          exteriorRes.json().catch(() => ({})),
          devRes.json().catch(() => ({})),
        ]);

        if (cancel) return;

        setLatest(Array.isArray(jsonLatest.items) ? jsonLatest.items : []);
        setCounts({
          mlo: extractTotal(mloJson),
          exterior: extractTotal(exteriorJson),
          dev: extractTotal(devJson),
        });

        setLatestStatus("idle");
      } catch (e) {
        if (!cancel) setLatestStatus("error");
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  // ✅ Labels (fallback if null)
  const mloLabel = counts.mlo != null ? `${counts.mlo} Project` : "— Project";
  const cityLabel = counts.exterior != null ? `${counts.exterior} Project` : "— Project";

  return (
    // ✅ Élargi ici : max-w-7xl (ou max-w-[1400px] si tu veux encore plus)
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-6">
      {/* HERO / FEATURED */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_40px_140px_-90px_rgba(0,0,0,0.95)]">
        <div className="relative">
          <SafeImage
            src={featured?.image || heroImg}
            alt="Featured project"
            className="h-[340px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <div className="absolute left-6 top-6">
            <Pill>Featured</Pill>
          </div>

          <div className="absolute bottom-10 left-6 right-6">
            <div className="max-w-2xl">
              <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_8px_34px_rgba(0,0,0,0.55)]">
                {featured?.title || "Featured Project Name"}
              </div>

              <div className="mt-1 text-sm text-white/70">
                {featured?.shortDesc || featured?.description || "Short description of the RP interior or area"}
              </div>

              <div className="mt-5">
                {featured?.slug ? (
                  <GlowButton to={`/projects/${featured.slug}`}>View Project</GlowButton>
                ) : (
                  <GlowButton to="/projects">View Project</GlowButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CategoryCard
          title="MLO project"
          subtitle="Interior mapping (shop, HQ, bank …)"
          img={mloImg}
          to="/projects?mappingType=mlo"
          height={230}
          countLabel={mloLabel}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 21V3h18v18H3zm2-2h5V5H5v14zm7 0h7V5h-7v14z" />
            </svg>
          }
        />

        <CategoryCard
          title="City Maps"
          subtitle="Exterior map edits (area, jobs …)"
          img={cityImg}
          to="/projects?mappingType=exterior"
          height={230}
          countLabel={cityLabel}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 21V8l7-3v16H3zm9 0V3l9 4v14h-9z" />
            </svg>
          }
        />

        <CategoryCard
          title="Custom Order"
          subtitle="Custom mapping services"
          img={customImg}
          to="/contact"
          height={150}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 7h20v4H2V7zm0 6h20v4H2v-4z" />
            </svg>
          }
        />

        <CategoryCard
          title="Dev + Mapping"
          subtitle="Scripts, map features & more."
          img={devImg}
          to="/projects?mappingType=rework"
          height={150}
          countLabel={counts.dev != null ? `${counts.dev} Project` : null}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 17l4-4-4-4v8zm6-8h2v8h-2V9z" />
            </svg>
          }
        />
      </section>

      {/* SERVICES */}
      <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_40px_140px_-100px_rgba(0,0,0,0.95)]">
        <div className="text-center text-3xl font-extrabold tracking-tight text-white/90">
          Custom services
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          <Service
            title="Custom MLO Creation"
            text="Custom interior creation tailored to your RP server needs. Optimized prop placement, clean collision setup, and stable performance for multiplayer environments."
          />
          <Service
            title="Exterior Mapping"
            text="Custom exterior environments and full area reworks. Zone redesign, immersive detailing, and optimized streaming for high-population servers."
          />
          <Service
            title="Optimisation"
            text="Performance analysis and improvement of existing maps. Prop cleanup, LOD adjustments, and streaming optimization to ensure smooth gameplay."
          />
        </div>

        <div className="mt-10 flex justify-center">
          <GlowButton to="/contact" className="px-14">
            Request Custom Project
          </GlowButton>
        </div>
      </section>

      {/* WHAT'S NEW */}
      <section className="mt-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-white/90">What’s New</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {latestStatus === "loading" &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[160px] rounded-2xl border border-white/10 bg-white/5 animate-pulse"
              />
            ))}

          {latestStatus !== "loading" &&
            (latest?.length ? (
              latest.slice(0, 3).map((p) => (
                <NewCard
                  key={p._id || p.id || p.slug}
                  title={p.title || "Untitled"}
                  date={formatDateFR(p.createdAt || p.updatedAt)}
                  img={p.image || heroImg}
                  to={p.slug ? `/projects/${p.slug}` : "/projects"}
                />
              ))
            ) : (
              <>
                <NewCard title="Pillbox Hospital" date="02/02/2026" img={heroImg} to="/projects" />
                <NewCard title="Motor Club" date="09/02/2026" img={heroImg} to="/projects" />
                <NewCard title="Benny’s Interior" date="10/02/2026" img={heroImg} to="/projects" />
              </>
            ))}
        </div>
      </section>
    </div>
  );
}