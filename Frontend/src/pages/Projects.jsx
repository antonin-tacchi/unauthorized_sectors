// src/pages/Projects.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import ProjectCard from "../components/ProjectCard";
import { useStagger } from "../hooks/useScrollReveal";
import { useDebounce } from "../hooks/useDebounce";

const API_URL = import.meta.env.VITE_API_URL || "";

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-black">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const didInitFromUrl = useRef(false);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const listRef = useStagger(":scope > *", { stagger: 0.1, noScroll: true }, [status]);

  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [mappingType, setMappingType] = useState("");
  const [sort, setSort] = useState("new");

  const [style, setStyle] = useState("");
  const [size, setSize] = useState("");
  const [performance, setPerformance] = useState("");

  const [tag, setTag] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  const MAPPING_TYPES = [
    { label: t("projects.typeLabel"), value: "" },
    { label: t("projects.mappingTypes.mlo"), value: "mlo" },
    { label: t("projects.mappingTypes.interior"), value: "interior" },
    { label: t("projects.mappingTypes.exterior"), value: "exterior" },
    { label: "YMAP", value: "ymap" },
    { label: "YTYP", value: "ytyp" },
    { label: t("projects.mappingTypes.customProps"), value: "custom-props" },
    { label: t("projects.mappingTypes.addonMap"), value: "addon-map" },
    { label: t("projects.mappingTypes.rework"), value: "rework" },
  ];

  const STYLES = [
    { label: t("projects.styleLabel"), value: "" },
    { label: t("projects.styles.modern"), value: "modern" },
    { label: t("projects.styles.classic"), value: "classic" },
    { label: t("projects.styles.cyber"), value: "cyber" },
  ];

  const SIZES = [
    { label: t("projects.sizeLabel"), value: "" },
    { label: t("projects.sizes.small"), value: "small" },
    { label: t("projects.sizes.medium"), value: "medium" },
    { label: t("projects.sizes.massive"), value: "massive" },
  ];

  const PERF = [
    { label: t("projects.performanceLabel"), value: "" },
    { label: t("projects.performances.optimized"), value: "optimized" },
    { label: t("projects.performances.balanced"), value: "balanced" },
    { label: t("projects.performances.heavy"), value: "heavy" },
  ];

  const SORTS = [
    { label: t("projects.sortNewest"), value: "new" },
    { label: t("projects.sortOldest"), value: "old" },
    { label: t("projects.sortTitle"), value: "title" },
  ];

  // 1) INIT : URL -> state (une seule fois)
  useEffect(() => {
    if (didInitFromUrl.current) return;
    setQ(searchParams.get("q") || "");
    setMappingType(searchParams.get("mappingType") || "");
    setSort(searchParams.get("sort") || "new");
    setStyle(searchParams.get("style") || "");
    setSize(searchParams.get("size") || "");
    setPerformance(searchParams.get("performance") || "");
    setTag(searchParams.get("tag") || "");
    const spPage = parseInt(searchParams.get("page") || "1", 10) || 1;
    setPage(Math.max(1, spPage));
    didInitFromUrl.current = true;
  }, [searchParams]);

  // 2) Quand un filtre change -> page 1
  useEffect(() => {
    if (!didInitFromUrl.current) return;
    setPage(1);
  }, [debouncedQ, mappingType, sort, style, size, performance, tag]);

  // 3) Sync state -> URL
  useEffect(() => {
    if (!didInitFromUrl.current) return;
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (mappingType) params.set("mappingType", mappingType);
    if (sort) params.set("sort", sort);
    if (style) params.set("style", style);
    if (size) params.set("size", size);
    if (performance) params.set("performance", performance);
    if (tag) params.set("tag", tag);
    params.set("page", String(page));
    params.set("limit", String(limit));
    setSearchParams(params, { replace: true });
  }, [debouncedQ, mappingType, sort, style, size, performance, tag, page, limit, setSearchParams]);

  // 4) queryString -> fetch
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (mappingType) params.set("mappingType", mappingType);
    if (sort) params.set("sort", sort);
    if (style) params.set("style", style);
    if (size) params.set("size", size);
    if (performance) params.set("performance", performance);
    if (tag) params.set("tag", tag);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [debouncedQ, mappingType, sort, style, size, performance, tag, page, limit]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProjects() {
      try {
        setStatus("loading");
        setError("");
        const res = await fetch(`${API_URL}/api/projects?${queryString}`);
        if (!res.ok) throw new Error(`API error (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
          setStatus("idle");
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e?.message || "Erreur serveur");
        }
      }
    }
    fetchProjects();
    return () => { cancelled = true; };
  }, [queryString]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Helmet>
        <title>Projects — Antonin TACCHI</title>
        <meta name="description" content="Browse all FiveM mapping projects by Antonin TACCHI — MLO interiors, exterior maps, and custom RP environments for GTA V servers." />
        <link rel="canonical" href="https://antonin-tacchi.com/projects" />
        <meta property="og:title" content="Projects — Antonin TACCHI" />
        <meta property="og:description" content="Browse all FiveM mapping projects by Antonin TACCHI — MLO interiors, exterior maps, and custom RP environments for GTA V servers." />
        <meta property="og:url" content="https://antonin-tacchi.com/projects" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Projects — Antonin TACCHI" />
        <meta name="twitter:description" content="Browse all FiveM mapping projects by Antonin TACCHI — MLO interiors, exterior maps, and custom RP environments for GTA V servers." />
      </Helmet>
      <div className="px-6 pt-7 pb-6">
        <div className="mt-5 rounded-xl border border-white/10 bg-[#101828]/60 px-4 py-3 space-y-3">
          {/* Row 1 : search + sort (full width on mobile) */}
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("projects.searchPlaceholder")}
              className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="text-black">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2 : filters + count */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={mappingType} onChange={setMappingType} options={MAPPING_TYPES} />
            <Select value={style} onChange={setStyle} options={STYLES} />
            <Select value={size} onChange={setSize} options={SIZES} />
            <Select value={performance} onChange={setPerformance} options={PERF} />
            <span className="ml-auto text-xs text-white/40">
              <span className="text-white/70">{total}</span> {total !== 1 ? t("projects.projectCount_other", { count: total }).replace(/^\d+ /, "") : t("projects.projectCount_one", { count: total }).replace(/^\d+ /, "")}
            </span>
          </div>
        </div>

        {status === "loading" && (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[220px] rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            <div className="font-semibold">Erreur</div>
            <div className="text-sm opacity-90">{error}</div>
          </div>
        )}

        {status === "idle" && (
          <>
            {items.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl opacity-30">🔍</span>
                <p className="text-white/60 font-medium">{t("projects.noResults")}</p>
                {debouncedQ && (
                  <p className="text-white/35 text-sm">{t("projects.noResultsQuery", { query: debouncedQ })}</p>
                )}
                <button
                  onClick={() => { setQ(""); setMappingType(""); setStyle(""); setSize(""); setPerformance(""); }}
                  className="mt-2 text-xs text-[#6b5cff] hover:text-[#8b7dff] transition"
                >
                  {t("projects.clearFilters")}
                </button>
              </div>
            ) : (
              <div ref={listRef} className="mt-8 space-y-4">
                {items.map((p) => (
                  <ProjectCard key={p._id || p.id} project={p} apiUrl={API_URL} />
                ))}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-40"
              >
                {t("projects.prev")}
              </button>

              <div className="text-sm text-white/70">
                {t("projects.page")} <span className="text-white">{page}</span> /{" "}
                <span className="text-white">{totalPages}</span>
              </div>

              <button
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-40"
              >
                {t("projects.next")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
