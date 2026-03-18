import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import SafeImage from "../components/SafeImage";
import { useReveal, useStagger } from "../hooks/useScrollReveal";

const API_URL = import.meta.env.VITE_API_URL || "";

import heroImg from "../img/HeroPortfolio.webp";
import mloImg from "../img/MLOPortfolio.jpeg";
import cityImg from "../img/AerialViewGTA.png";
import customImg from "../img/Custom_Project.jpg";
import devImg from "../img/Scipt_Mapping.jpg";

function formatDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
        "shadow-[0_22px_70px_-26px_rgba(107,92,255,0.9)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_28px_80px_-20px_rgba(107,92,255,0.85)] active:brightness-95 active:translate-y-0 transition duration-200",
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
        "group relative overflow-hidden rounded-2xl border border-white/10 transition duration-300",
        "bg-white/5 shadow-[0_38px_120px_-80px_rgba(0,0,0,0.95)] hover:border-[#6b5cff]/40 hover:shadow-[0_0_32px_-8px_rgba(107,92,255,0.3)]",
      ].join(" ")}
    >
      <SafeImage
        src={img}
        alt={title}
        className="w-full"
        imgClassName="transition duration-500 group-hover:scale-[1.03]"
        style={{ height }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      <div className="absolute left-6 top-6 text-[#6b5cff] opacity-95">{icon}</div>
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.55)]">
          {title}
        </div>
        <div className="mt-1 text-sm text-white/75">{subtitle}</div>
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
        className="h-[160px] w-full"
        imgClassName="transition duration-500 group-hover:scale-[1.03]"
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
  const { t } = useTranslation();
  const [latest, setLatest] = useState([]);
  const [latestStatus, setLatestStatus] = useState("loading");

  const heroRef     = useReveal({ noScroll: true, delay: 0.15 });
  const catsRef     = useStagger(":scope > *", { stagger: 0.15 });
  const servicesRef = useReveal();
  const whatsNewRef = useStagger(":scope > *", { stagger: 0.15 }, [latestStatus]);

  const featured = useMemo(() => latest?.[0] || null, [latest]);

  const [counts, setCounts] = useState({ mlo: null, exterior: null, dev: null });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLatestStatus("loading");
        const [resLatest, resStats] = await Promise.all([
          fetch(`${API_URL}/api/projects?sort=new&page=1&limit=3`),
          fetch(`${API_URL}/api/projects/stats`),
        ]);
        const [jsonLatest, jsonStats] = await Promise.all([
          resLatest.json(),
          resStats.json().catch(() => ({})),
        ]);
        if (!resLatest.ok) throw new Error(jsonLatest?.message || "API error");
        if (cancel) return;
        setLatest(Array.isArray(jsonLatest.items) ? jsonLatest.items : []);
        setCounts({
          mlo: jsonStats?.byMappingType?.mlo ?? null,
          exterior: jsonStats?.byMappingType?.exterior ?? null,
          dev: jsonStats?.byMappingType?.rework ?? null,
        });
        setLatestStatus("idle");
      } catch (e) {
        if (!cancel) setLatestStatus("error");
      }
    })();
    return () => { cancel = true; };
  }, []);

  const mloLabel = counts.mlo != null ? t("home.projectCount", { count: counts.mlo }) : `— ${t("home.projectCount", { count: 0 }).replace("0 ", "")}`;
  const cityLabel = counts.exterior != null ? t("home.projectCount", { count: counts.exterior }) : `— ${t("home.projectCount", { count: 0 }).replace("0 ", "")}`;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-6">
      <Helmet>
        <title>Antonin TACCHI — FiveM Mapping Portfolio</title>
        <meta name="description" content="Portfolio of Antonin TACCHI, professional FiveM mapper & developer. Custom MLO, exterior mapping, optimization services for GTA V RP servers." />
        <link rel="canonical" href="https://antonin-tacchi.com/" />
        <meta property="og:title" content="Antonin TACCHI — FiveM Mapping Portfolio" />
        <meta property="og:description" content="Professional FiveM mapper & developer. Custom MLO, exterior mapping, optimization services for GTA V RP servers." />
        <meta property="og:url" content="https://antonin-tacchi.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Antonin TACCHI — FiveM Mapping Portfolio" />
        <meta name="twitter:description" content="Professional FiveM mapper & developer. Custom MLO, exterior mapping, optimization services for GTA V RP servers." />
      </Helmet>

      {/* HERO / FEATURED */}
      <section ref={heroRef} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_40px_140px_-90px_rgba(0,0,0,0.95)]">
        <div className="relative">
          <SafeImage
            src={featured?.image || heroImg}
            alt="Featured project"
            className="h-[340px] w-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute left-6 top-6">
            <Pill>{t("home.featured")}</Pill>
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
                  <GlowButton to={`/projects/${featured.slug}`}>{t("home.viewProject")}</GlowButton>
                ) : (
                  <GlowButton to="/projects">{t("home.viewProject")}</GlowButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section ref={catsRef} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CategoryCard
          title={t("home.mloTitle")}
          subtitle={t("home.mloSubtitle")}
          img={mloImg}
          to="/projects?mappingType=mlo"
          height={230}
          countLabel={counts.mlo != null ? t("home.projectCount", { count: counts.mlo }) : null}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 21V3h18v18H3zm2-2h5V5H5v14zm7 0h7V5h-7v14z" />
            </svg>
          }
        />
        <CategoryCard
          title={t("home.cityTitle")}
          subtitle={t("home.citySubtitle")}
          img={cityImg}
          to="/projects?mappingType=exterior"
          height={230}
          countLabel={counts.exterior != null ? t("home.projectCount", { count: counts.exterior }) : null}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 21V8l7-3v16H3zm9 0V3l9 4v14h-9z" />
            </svg>
          }
        />
        <CategoryCard
          title={t("home.customTitle")}
          subtitle={t("home.customSubtitle")}
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
          title={t("home.devTitle")}
          subtitle={t("home.devSubtitle")}
          img={devImg}
          to="/projects?mappingType=rework"
          height={150}
          countLabel={counts.dev != null ? t("home.projectCount", { count: counts.dev }) : null}
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 17l4-4-4-4v8zm6-8h2v8h-2V9z" />
            </svg>
          }
        />
      </section>

      {/* SERVICES */}
      <section ref={servicesRef} className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_40px_140px_-100px_rgba(0,0,0,0.95)]">
        <div className="text-center text-3xl font-extrabold tracking-tight text-white/90">
          {t("home.services")}
        </div>
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          <Service title={t("home.service1Title")} text={t("home.service1Text")} />
          <Service title={t("home.service2Title")} text={t("home.service2Text")} />
          <Service title={t("home.service3Title")} text={t("home.service3Text")} />
        </div>
        <div className="mt-10 flex justify-center">
          <GlowButton to="/contact" className="px-14">{t("home.cta")}</GlowButton>
        </div>
      </section>

      {/* WHAT'S NEW */}
      <section className="mt-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-white/90">{t("home.whatsNew")}</h2>
        <div ref={whatsNewRef} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {latestStatus === "loading" &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[160px] rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          {latestStatus !== "loading" &&
            (latest?.length ? (
              latest.slice(0, 3).map((p) => (
                <NewCard
                  key={p._id || p.id || p.slug}
                  title={p.title || "Untitled"}
                  date={formatDate(p.createdAt || p.updatedAt)}
                  img={p.image || heroImg}
                  to={p.slug ? `/projects/${p.slug}` : "/projects"}
                />
              ))
            ) : (
              <>
                <NewCard title="Pillbox Hospital" date="02/02/2026" img={heroImg} to="/projects" />
                <NewCard title="Motor Club" date="09/02/2026" img={heroImg} to="/projects" />
                <NewCard title="Benny's Interior" date="10/02/2026" img={heroImg} to="/projects" />
              </>
            ))}
        </div>
      </section>
    </div>
  );
}
