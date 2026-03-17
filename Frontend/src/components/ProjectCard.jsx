import { useState } from "react";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";
import { useFavorites } from "../context/FavoritesContext";

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

export default function ProjectCard({ project }) {
  const { favorites, toggle } = useFavorites();
  const id = String(project._id);
  const isFav = favorites.has(id);
  const [favCount, setFavCount] = useState(project.stats?.favorites ?? 0);

  const tags = (project.tags || []).slice(0, 6);
  const createdAt = project.createdAt ? new Date(project.createdAt) : null;
  const isNew =
    createdAt && Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  const isPopular = (project.tags || []).some(
    (t) => String(t).toLowerCase() === "popular"
  );

  function handleFav(e) {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101828]/70 px-4 py-4 transition duration-300 hover:border-[#6b5cff]/40 hover:shadow-[0_0_28px_-8px_rgba(107,92,255,0.35)]">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image */}
        <Link
          to={`/projects/${project.slug}`}
          className="relative w-full md:w-[340px] shrink-0 overflow-hidden rounded-xl bg-black/30 border border-white/10"
        >
          <SafeImage
            src={project.image}
            alt={project.title}
            className="aspect-[16/9]"
            imgClassName="transition duration-500 group-hover:scale-[1.04]"
          />

          {/* top-left badge */}
          {isNew && (
            <span className="absolute left-3 top-3 rounded-md bg-[#5d5bd6] px-3 py-1 text-xs font-semibold">
              New
            </span>
          )}

          {/* heart button top-right */}
          <button
            onClick={handleFav}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1.5 text-white transition-transform duration-150 active:scale-125 hover:bg-black/70"
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={isFav} />
            <span className="text-xs font-semibold">{favCount}</span>
          </button>

          {/* bottom-right badge */}
          {isPopular && (
            <span className="absolute bottom-3 right-3 rounded-md bg-[#5d5bd6] px-3 py-1 text-xs font-semibold">
              Popular
            </span>
          )}
        </Link>

        {/* Middle content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-xl md:text-2xl font-semibold leading-tight">
              {project.title}
            </h3>
            <span className="text-white/50 text-base">
              {project?.pricing?.cents ? `${(project.pricing.cents / 100).toFixed(0)} $` : "—"}
            </span>
          </div>

          <p className="mt-2 text-sm text-white/65 leading-relaxed line-clamp-3 md:line-clamp-4">
            {project.description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Nullam quis imperdiet augue."}
          </p>

          {/* Tags pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#5d5bd6]/90 px-3 py-0.5 text-xs font-semibold text-white"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right meta */}
        <div className="md:w-[190px] shrink-0 md:border-l border-t md:border-t-0 border-white/10 pt-3 md:pt-0 md:pl-4 flex md:flex-col flex-row items-center md:items-stretch justify-between gap-3">
          <div className="flex md:flex-col flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
            <span className="capitalize">{project.mappingType || "—"}</span>
            <span className="font-semibold text-white/90 capitalize">{project.size || "—"}</span>
            <span className="capitalize">{project.performance || "—"}</span>
          </div>

          <Link
            to={`/projects/${project.slug}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#5d5bd6] px-5 py-2.5 text-sm font-semibold
                       transition duration-200 hover:brightness-110 hover:-translate-y-0.5
                       hover:shadow-[0_8px_24px_-8px_rgba(107,92,255,0.7)] md:mt-auto shrink-0"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
