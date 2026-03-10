import { useEffect, useMemo, useRef, useState, lazy, Suspense as LazySuspense } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from "react-compare-slider";
import SafeImage from "../components/SafeImage";
import { useFavorites } from "../context/FavoritesContext";
const ModelViewer = lazy(() => import("../components/ModelViewer"));

const API_URL = import.meta.env.VITE_API_URL || "";

function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="#ef4444" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function moneyUSD(cents) {
  if (!cents) return "";
  return `${Math.round(cents / 100)} $`;
}

export default function ProjectDetails() {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [viewCount, setViewCount] = useState(null);

  // Unified gallery items: images + videos + optional 3D slot
  // Each item: { type: "image"|"video"|"3d", url, role }
  const galleryItems = useMemo(() => {
    if (!project) return [];
    const cover = project.image ? [{ type: "image", url: project.image, role: "cover" }] : [];
    const fromMedia = Array.isArray(project.media)
      ? project.media
          .filter((m) => m?.url && (m.mediaType === "image" || m.mediaType === "video"))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((m) => ({ type: m.mediaType === "video" ? "video" : "image", url: m.url, role: m.role || "gallery" }))
      : [];
    const model3d = project.modelUrl ? [{ type: "3d", url: project.modelUrl, role: "3d" }] : [];
    const all = [...cover, ...fromMedia, ...model3d];
    return all.length ? all : [{ type: "image", url: "https://picsum.photos/1200/700?random=90", role: "gallery" }];
  }, [project]);

  // Backward-compat: images array for before/after slider
  const images = useMemo(() => galleryItems.filter(i => i.type === "image").map(i => i.url), [galleryItems]);

  // Before / After pour le slider
  const { beforeImg, afterImg } = useMemo(() => {
    const mediaItems = Array.isArray(project?.media)
      ? project.media.filter((m) => m?.mediaType === "image" && m?.url)
      : [];
    const before =
      mediaItems.find((m) => m.role === "before")?.url ||
      (images.length >= 2 ? images[1] : null);
    const after =
      mediaItems.find((m) => m.role === "after")?.url ||
      (images.length >= 1 ? images[0] : null);
    return { beforeImg: before, afterImg: after };
  }, [project, images]);

  const showSlider = beforeImg && afterImg && beforeImg !== afterImg;

  const { favorites, toggle } = useFavorites();
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    if (project) setFavCount(project.stats?.favorites ?? 0);
  }, [project]);

  function handleFav() {
    if (!project) return;
    const id = String(project._id);
    const wasFav = favorites.has(id);
    toggle(id);
    setFavCount((c) => (wasFav ? Math.max(0, c - 1) : c + 1));
    fetch(`${API_URL}/api/projects/${id}/${wasFav ? "unfavorite" : "favorite"}`, {
      method: "POST",
    }).catch(() => {
      toggle(id);
      setFavCount((c) => (wasFav ? c + 1 : Math.max(0, c - 1)));
    });
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef(null);
  const [tab, setTab] = useState("overview"); // overview | features | technical

  useEffect(() => {
    let cancelled = false;

    async function fetchDetails() {
      try {
        setStatus("loading");
        setError("");

        const res = await fetch(`${API_URL}/api/projects/${slug}`);
        if (!res.ok) throw new Error(`API error (${res.status})`);

        const data = await res.json();
        if (!cancelled) {
          setProject(data);
          setActiveIdx(0);
          setTab("overview");
          setStatus("idle");

          // fire-and-forget : increment view counter
          fetch(`${API_URL}/api/projects/${slug}/view`, { method: "PATCH" })
            .then((r) => r.json())
            .then((d) => { if (!cancelled && d?.views != null) setViewCount(d.views); })
            .catch(() => {});
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e?.message || "Erreur serveur");
        }
      }
    }

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-[520px] rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
        <Link className="inline-block mt-4 text-white/70 hover:text-white" to="/projects">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  const price = moneyUSD(project?.pricing?.cents) || "130 $";
  const tags = (project.tags || []).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Helmet>
        <title>{project.title} — Antonin TACCHI</title>
        <meta name="description" content={project.shortDesc || project.description || `${project.title} — FiveM mapping project by Antonin TACCHI.`} />
      </Helmet>
      {/* top */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-6">
        {/* Left: Gallery */}
        <div className="rounded-2xl border border-white/55 p-4">

          {/* Main viewer */}
          <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-[16/9]">
            {(() => {
              const active = galleryItems[activeIdx];
              if (!active) return null;
              if (active.type === "3d") {
                return (
                  <LazySuspense fallback={<div className="h-full w-full animate-pulse bg-white/5" />}>
                    <ModelViewer url={active.url} fallbackImage={images[0]} />
                  </LazySuspense>
                );
              }
              if (active.type === "video") {
                return (
                  <video
                    ref={videoRef}
                    key={active.url}
                    src={active.url}
                    controls
                    className="h-full w-full object-contain bg-black"
                    preload="metadata"
                  />
                );
              }
              return (
                <SafeImage
                  src={active.url}
                  alt={project.title}
                  className="h-full w-full"
                />
              );
            })()}
          </div>

          {/* Thumbnails */}
          {galleryItems.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryItems.slice(0, 8).map((item, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={`${item.url}-${idx}`}
                    onClick={() => setActiveIdx(idx)}
                    className={[
                      "relative overflow-hidden rounded-lg border bg-black/30 aspect-[16/9]",
                      isActive ? "border-[#5d5bd6]" : "border-white/10 hover:border-white/25",
                    ].join(" ")}
                  >
                    {item.type === "3d" ? (
                      <div className="h-full w-full flex items-center justify-center bg-[#0a0d14]">
                        <span className="text-xs text-[#6b5cff] font-bold">3D</span>
                      </div>
                    ) : item.type === "video" ? (
                      <div className="h-full w-full flex items-center justify-center bg-black/60">
                        <span className="text-white text-lg">▶</span>
                      </div>
                    ) : (
                      <SafeImage src={item.url} alt="" className="h-full w-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* description */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="mt-2 text-white/65 leading-relaxed">
              {project.description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris."}
            </p>
          </div>

          {/* before / after slider */}
          {showSlider && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Before / After</h3>
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <ReactCompareSlider
                  position={50}
                  itemOne={<ReactCompareSliderImage src={beforeImg} alt="GTA V" style={{ objectFit: "cover" }} />}
                  itemTwo={<ReactCompareSliderImage src={afterImg} alt="Custom MLO" style={{ objectFit: "cover" }} />}
                  handle={
                    <ReactCompareSliderHandle
                      buttonStyle={{ backgroundColor: "#5d5bd6", border: "none", color: "white", width: 36, height: 36 }}
                      linesStyle={{ color: "#5d5bd6", width: 3 }}
                    />
                  }
                  style={{ width: "100%", aspectRatio: "16/9" }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-3">
                  <span className="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">GTA V</span>
                  <span className="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">Custom MLO</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info / CTA / Tabs */}
        <div className="rounded-2xl border border-white/55 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold truncate">{project.title}</h1>
              <div className="mt-1 flex items-center gap-3 text-white/70">
                <span>Price {price}</span>
                <span className="text-white/35">·</span>
                <span className="text-sm text-white/50">{viewCount ?? project.views ?? 0} views</span>
                <span className="text-white/35">·</span>
                <button
                  onClick={handleFav}
                  className="flex items-center gap-1.5 transition-transform duration-150 active:scale-125 hover:text-red-400"
                  title={favorites.has(String(project._id)) ? "Remove from favorites" : "Add to favorites"}
                >
                  <HeartIcon filled={favorites.has(String(project._id))} />
                  <span className="text-xs font-semibold text-white/60">{favCount}</span>
                </button>
              </div>
              <p className="mt-3 text-white/65 text-sm leading-relaxed">
                {project.shortDesc ||
                  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ut et massa mi. Aliquam in hendrerit urna."}
              </p>
            </div>
          </div>

          {/* pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="mt-4 flex flex-wrap gap-2">
              {(project.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#5d5bd6]/90 px-4 py-1 text-xs font-semibold text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-5">
            <Link
              to="/contact"
              className="block w-full rounded-2xl bg-[#5d5bd6] px-6 py-4 text-center font-semibold hover:brightness-110 transition"
            >
              Contact / Order
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <Tabs tab={tab} onTab={setTab} />
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              {tab === "overview" && (
                <div className="space-y-3 text-white/75">
                  {project.overview?.length > 0 ? (
                    project.overview.map((item, i) => <CheckLine key={i}>{item}</CheckLine>)
                  ) : (
                    <p className="text-white/35 text-sm italic">No overview defined.</p>
                  )}
                </div>
              )}

              {tab === "features" && (
                <div className="space-y-3 text-white/75">
                  {project.features?.length > 0 ? (
                    project.features.map((item, i) => <CheckLine key={i}>{item}</CheckLine>)
                  ) : (
                    <p className="text-white/35 text-sm italic">No features defined.</p>
                  )}
                </div>
              )}

              {tab === "technical" && (
                <div className="space-y-4 text-white/75">
                  {project.technical?.frameworks?.length > 0 && (
                    <div>
                      <div className="text-white font-semibold">Supported Frameworks</div>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-white/70">
                        {project.technical.frameworks.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {project.technical?.categories?.length > 0 && (
                    <>
                      <div className="h-px bg-white/10" />
                      <div>
                        <div className="text-white font-semibold">RP Category</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-white/70">
                          {project.technical.categories.slice(0, 4).map((c, i) => <div key={i}>{c}</div>)}
                        </div>
                      </div>
                    </>
                  )}

                  {project.technical?.faq?.length > 0 && (
                    <>
                      <div className="h-px bg-white/10" />
                      <div>
                        <div className="text-white font-semibold">FAQ</div>
                        <div className="mt-2 space-y-2 text-white/70 text-sm">
                          {project.technical.faq.map((item, i) => (
                            <div key={i}>
                              <div className="text-white/80">Q: {item.question}</div>
                              <div>A: {item.answer}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {!project.technical?.frameworks?.length && !project.technical?.categories?.length && !project.technical?.faq?.length && (
                    <p className="text-white/35 text-sm italic">No technical info defined.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* back link */}
          <Link className="inline-block mt-6 text-white/70 hover:text-white" to="/projects">
            ← Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI ---------- */

function Tabs({ tab, onTab }) {
  const base =
    "flex-1 py-2.5 text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition";
  const active = "bg-[#5d5bd6] border-[#5d5bd6] text-white";
  const idle = "text-white/75";

  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-xl">
      <button
        className={[base, tab === "overview" ? active : idle].join(" ")}
        onClick={() => onTab("overview")}
      >
        Overview
      </button>
      <button
        className={[base, tab === "features" ? active : idle].join(" ")}
        onClick={() => onTab("features")}
      >
        Features
      </button>
      <button
        className={[base, tab === "technical" ? active : idle].join(" ")}
        onClick={() => onTab("technical")}
      >
        Technical
      </button>
    </div>
  );
}

function CheckLine({ children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#5d5bd6]">✓</span>
      <div>{children}</div>
    </div>
  );
}
