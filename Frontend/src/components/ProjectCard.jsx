import { Link } from "react-router-dom";

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
      <div className="flex gap-4">
        {/* Image */}
        <Link
          to={`/projects/${project.slug}`}
          className="relative w-[340px] shrink-0 overflow-hidden rounded-xl bg-black/30 border border-white/10"
        >
          <div className="aspect-[16/9]">
            <img
              src={project.image || "https://picsum.photos/900/600?random=42"}
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
        <div className="w-[190px] shrink-0 border-l border-white/10 pl-4 flex flex-col justify-between">
          <div className="text-sm text-white/75 space-y-2">
            <div className="text-white/80">Exterior &amp; Interior</div>
            <div className="text-white/90 text-base font-semibold">3560</div>
            <div className="text-white/70">Low</div>
          </div>

          <Link
            to={`/projects/${project.slug}`}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#5d5bd6] px-6 py-3 font-semibold
                       hover:brightness-110 transition"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
