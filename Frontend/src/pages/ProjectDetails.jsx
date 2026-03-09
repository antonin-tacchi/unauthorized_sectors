import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SafeImage from "../components/SafeImage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function moneyUSD(cents) {
  if (!cents) return "";
  return `${Math.round(cents / 100)} $`;
}

export default function ProjectDetails() {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // mock media fallback (tant que tu n’as pas branché project_media)
  const images = useMemo(() => {
    const cover = project?.image || "";

    const fromMedia = Array.isArray(project?.media)
      ? project.media
          .filter((m) => m?.mediaType === "image" && m?.url)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((m) => m.url)
      : [];

    const list = [cover, ...fromMedia].filter(Boolean);
    const uniq = [...new Set(list)];

    // fallback (just in case DB is empty, sinon img cassée)
    return uniq.length ? uniq : ["https://picsum.photos/1200/700?random=90"];
  }, [project]);

  const [activeImg, setActiveImg] = useState(0);
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
          setActiveImg(0);
          setTab("overview");
          setStatus("idle");
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
      {/* top */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-6">
        {/* Left: Gallery */}
        <div className="rounded-2xl border border-white/55 p-4">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <div className="aspect-[16/9]">
              <SafeImage
                src={images[activeImg]}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* thumbs */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.slice(1, 5).map((url, i) => {
              const idx = i + 1;
              const isActive = idx === activeImg;
              return (
                <button
                  key={url}
                  onClick={() => setActiveImg(idx)}
                  className={[
                    "overflow-hidden rounded-lg border bg-black/30 aspect-[16/9]",
                    isActive ? "border-[#5d5bd6]" : "border-white/10 hover:border-white/25",
                  ].join(" ")}
                  title="Open image"
                >
                  <SafeImage src={url} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>

          {/* featured video block */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Featured video</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 aspect-video relative">
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-16 w-16 rounded-2xl bg-[#5d5bd6] grid place-items-center shadow-lg">
                  <span className="text-white text-2xl">▶</span>
                </div>
              </div>
              <SafeImage
                src={images[0]}
                alt=""
                className="h-full w-full object-cover opacity-60"
              />
            </div>
          </div>

          {/* description */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="mt-2 text-white/65 leading-relaxed">
              {project.description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris."}
            </p>
          </div>
        </div>

        {/* Right: Info / CTA / Tabs */}
        <div className="rounded-2xl border border-white/55 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold truncate">{project.title}</h1>
              <div className="mt-1 text-white/70">Price {price}</div>
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
                  <CheckLine>Interior &amp; Exterior</CheckLine>
                  <CheckLine>Number of props : <span className="text-white">3560</span></CheckLine>
                  <CheckLine>MLO</CheckLine>
                  <CheckLine>FPS Impact : <span className="text-white">Low</span></CheckLine>
                </div>
              )}

              {tab === "features" && (
                <div className="space-y-3 text-white/75">
                  <CheckLine>Optimized collisions</CheckLine>
                  <CheckLine>Clean LODs</CheckLine>
                  <CheckLine>Vanilla friendly</CheckLine>
                  <CheckLine>RP ready</CheckLine>
                </div>
              )}

              {tab === "technical" && (
                <div className="space-y-4 text-white/75">
                  <div>
                    <div className="text-white font-semibold">Supported Frameworks</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-white/70">
                      <li>ESX</li>
                      <li>QBCore</li>
                      <li>Standalone</li>
                    </ul>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <div className="text-white font-semibold">RP Category</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-white/70">
                      <div>EMS</div>
                      <div className="text-right">Public Service</div>
                      <div>Medical</div>
                    </div>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <div className="text-white font-semibold">FAQ</div>
                    <div className="mt-2 space-y-2 text-white/70 text-sm">
                      <div>
                        <div className="text-white/80">Q: Is installation included?</div>
                        <div>A: Installation instructions are provided. Assistance is available on request.</div>
                      </div>
                      <div>
                        <div className="text-white/80">Q: Can I request custom modifications?</div>
                        <div>A: Yes, custom adjustments can be discussed depending on the project scope.</div>
                      </div>
                    </div>
                  </div>
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
