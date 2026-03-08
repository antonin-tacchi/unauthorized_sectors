import Project from "../models/Project.js";
import ProjectMedia from "../models/ProjectMedia.js";
import { generateUniqueSlug } from "../services/slug.service.js";

function slugify(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(slugify).filter(Boolean))];
}

/* ---------------- CREATE ---------------- */

export async function createProject(req, res) {
  try {
    const payload = { ...req.body };

    // mapping-only
    payload.type = "mapping";

    if (!payload.slug && payload.title) {
      payload.slug = await generateUniqueSlug(payload.title);
    }

    payload.titleLower = (payload.title || "").toLowerCase();

    // normalize filter fields (store slugs)
    if (payload.mappingType) payload.mappingType = slugify(payload.mappingType);
    if (payload.style) payload.style = slugify(payload.style);
    if (payload.size) payload.size = slugify(payload.size);
    if (payload.performance) payload.performance = slugify(payload.performance);

    payload.tags = normalizeTags(payload.tags);

    const project = await Project.create(payload);
    return res.status(201).json(project);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

/* ---------------- LIST ---------------- */

export async function listProjects(req, res) {
  try {
    const {
      q = "",
      page = "1",
      limit = "12",
      sort = "new",

      // filters from UI
      mappingType = "",
      style = "",
      size = "",
      performance = "",
      tag = "",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      type: "mapping",
      status: "published",
    };

    if (mappingType) filter.mappingType = slugify(mappingType);
    if (style) filter.style = slugify(style);
    if (size) filter.size = slugify(size);
    if (performance) filter.performance = slugify(performance);

    if (tag) filter.tags = slugify(tag);

    if (q && q.trim()) {
      const qq = q.trim();
      filter.$or = [
        { title: { $regex: qq, $options: "i" } },
        { shortDesc: { $regex: qq, $options: "i" } },
        { description: { $regex: qq, $options: "i" } },
        { tags: { $in: [new RegExp(qq, "i")] } },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === "old") sortObj = { createdAt: 1 };
    if (sort === "title") sortObj = { titleLower: 1 };

    const [itemsRaw, total] = await Promise.all([
      Project.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Project.countDocuments(filter),
    ]);

    // ✅ Ensure every project has its cover image from DB
    // Priority:
    // 1) projects.image (legacy/simple UI)
    // 2) project_media where isCover=true
    const items = Array.isArray(itemsRaw) ? [...itemsRaw] : [];
    const missingIds = items.filter((p) => !p.image).map((p) => p._id);

    if (missingIds.length) {
      const covers = await ProjectMedia.find({
        projectId: { $in: missingIds },
        isCover: true,
        mediaType: "image",
      })
        .select({ projectId: 1, url: 1 })
        .lean();

      const coverById = new Map(covers.map((c) => [String(c.projectId), c.url]));

      for (const p of items) {
        if (!p.image) p.image = coverById.get(String(p._id)) || "";
      }
    }

    return res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

/* ---------------- GET BY SLUG ---------------- */

export async function getProjectBySlug(req, res) {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      type: "mapping",
    }).lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Attach media (cover + gallery + videos) from DB
    const media = await ProjectMedia.find({ projectId: project._id })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select({ url: 1, alt: 1, mediaType: 1, provider: 1, isCover: 1, sortOrder: 1 })
      .lean();

    // If legacy image missing, pick cover from media
    if (!project.image) {
      const cover = media.find((m) => m.isCover && m.mediaType === "image");
      if (cover?.url) project.image = cover.url;
    }

    return res.json({ ...project, media });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}