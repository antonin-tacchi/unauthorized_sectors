import Project from "../models/Project.js";
import ProjectMedia from "../models/ProjectMedia.js";
import { generateUniqueSlug } from "../services/slug.service.js";

// Anti-spam vues : Map<"ip:slug" -> timestamp>
const viewCache = new Map();
const VIEW_TTL = 60 * 60 * 1000; // 1 heure

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

/* ---------------- STATS ---------------- */

export async function getProjectStats(req, res) {
  try {
    const baseFilter = { type: "mapping", status: "published" };

    const [total, byMappingType] = await Promise.all([
      Project.countDocuments(baseFilter),
      Project.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$mappingType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      total,
      byMappingType: Object.fromEntries(
        byMappingType.map(({ _id, count }) => [_id ?? "unknown", count])
      ),
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

    const media = await ProjectMedia.find({ projectId: project._id })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select({ url: 1, alt: 1, mediaType: 1, provider: 1, isCover: 1, sortOrder: 1, role: 1 })
      .lean();

    if (!project.image) {
      const cover = media.find((m) => m.isCover && m.mediaType === "image");
      if (cover?.url) project.image = cover.url;
    }

    return res.json({ ...project, media });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

/* ---------------- INCREMENT VIEW ---------------- */

export async function incrementView(req, res) {
  try {
    const ip   = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const slug = req.params.slug;
    const key  = `${ip}:${slug}`;
    const now  = Date.now();

    if (viewCache.size > 5000) {
      for (const [k, ts] of viewCache) {
        if (now - ts > VIEW_TTL) viewCache.delete(k);
      }
    }

    if (viewCache.has(key) && now - viewCache.get(key) < VIEW_TTL) {
      const project = await Project.findOne({ slug, type: "mapping" }).select("views").lean();
      return res.json({ views: project?.views ?? 0 });
    }

    viewCache.set(key, now);

    const project = await Project.findOneAndUpdate(
      { slug, type: "mapping" },
      { $inc: { views: 1 } },
      { new: true, select: "slug views" }
    ).lean();

    if (!project) return res.status(404).json({ message: "Project not found" });

    return res.json({ views: project.views });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
/* ---------------- UPDATE ---------------- */

export async function updateProject(req, res) {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    if (payload.title)       payload.titleLower  = payload.title.toLowerCase();
    if (payload.mappingType) payload.mappingType = slugify(payload.mappingType);
    if (payload.style)       payload.style       = slugify(payload.style);
    if (payload.size)        payload.size        = slugify(payload.size);
    if (payload.performance) payload.performance = slugify(payload.performance);
    if (payload.tags)        payload.tags        = normalizeTags(payload.tags);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).lean();

    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

/* ---------------- DELETE ---------------- */

export async function deleteProject(req, res) {
  try {
    const project = await Project.findByIdAndDelete(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

/* ---------------- FAVORITE ---------------- */

export async function favoriteProject(req, res) {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.favorites": 1 } },
      { new: true, select: "stats" }
    ).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ favorites: project.stats?.favorites ?? 0 });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function unfavoriteProject(req, res) {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      [{ $set: { "stats.favorites": { $max: [0, { $subtract: [{ $ifNull: ["$stats.favorites", 0] }, 1] }] } } }],
      { new: true, select: "stats" }
    ).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ favorites: project.stats?.favorites ?? 0 });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

/* ---------------- GET BY ID ---------------- */

export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
