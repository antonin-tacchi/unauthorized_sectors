import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";

export default function ProjectCard({ project }) {
  const tags = (project.tags || []).slice(0, 6);
  const createdAt = project.createdAt ? new Date(project.createdAt) : null;
  const isNew =
    createdAt && Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  const isPopular = (project.tags || []).some(
    (t) => String(t).toLowerCase() === "popular"
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101828]/70 px-4 py-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image */}
        <Link
          to={`/projects/${project.slug}`}
          className="relative w-full md:w-[340px] shrink-0 overflow-hidden rounded-xl bg-black/30 border border-white/10"
        >
          <div className="aspect-[16/9]">
            <SafeImage
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* top-left badge */}
          {isNew && (
            <span className="absolute left-3 top-3 rounded-md bg-[#5d5bd6] px-3 py-1 text-xs font-semibold">
              New
            </span>
          )}

          {/* bottom-right badge */}
          {isPopular && (
            <span className="absolute bottom-3 right-3 rounded-md bg-[#5d5bd6] px-3 py-1 text-xs font-semibold">
              Popular
            </span>
          )}
        </Link>

        {/* Middle content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold leading-tight truncate">
              {project.title}
            </h3>

            <span className="text-white/70">|</span>
            <span className="text-white/70 text-lg">
              {project?.pricing?.cents ? `${(project.pricing.cents / 100).toFixed(0)} $` : "—"}
            </span>
          </div>

          <p className="mt-2 text-sm text-white/65 leading-relaxed line-clamp-4">
            {project.description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Nullam quis imperdiet augue."}
          </p>

          {/* Tags pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#5d5bd6]/90 px-4 py-1 text-xs font-semibold text-white"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right meta */}
        <div className="md:w-[190px] shrink-0 md:border-l border-t md:border-t-0 border-white/10 pt-3 md:pt-0 md:pl-4 flex md:flex-col flex-row items-center md:items-stretch justify-between">
          <div className="text-sm text-white/75 md:space-y-2 flex md:flex-col flex-row gap-4 md:gap-0">
            <div className="text-white/80 capitalize">{project.mappingType || "—"}</div>
            <div className="text-white/90 text-base font-semibold capitalize">{project.size || "—"}</div>
            <div className="text-white/70 capitalize">{project.performance || "—"}</div>
          </div>

          <Link
            to={`/projects/${project.slug}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#5d5bd6] px-6 py-3 font-semibold
                       hover:brightness-110 transition md:mt-4"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
