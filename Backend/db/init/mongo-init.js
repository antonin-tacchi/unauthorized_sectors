/**
 * mongo-init.js — portfolio_mapping (FiveM mapping only)
 * Idempotent seed (upsert), schema validation (moderate), scalable media + versions.
 */

const DB_NAME = "portfolio_mapping";
db = db.getSiblingDB(DB_NAME);

// -----------------------------
// Helpers
// -----------------------------
function now() { return new Date(); }

function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function normalizeSlugs(arr) {
  return uniq((arr || []).map(slugify));
}

// mongo shell in docker init doesn't always have process.env.
// We'll read env if available, else fallback.
function env(name, fallback) {
  try {
    // eslint-disable-next-line no-undef
    if (typeof process !== "undefined" && process.env && process.env[name]) return process.env[name];
  } catch (e) {}
  return fallback;
}

// -----------------------------
// Ensure collections
// -----------------------------
const COLLECTIONS = [
  "filters",
  "tags",
  "projects",
  "project_versions",
  "project_media",
  "users",
];

const existing = db.getCollectionNames();
COLLECTIONS.forEach((c) => {
  if (!existing.includes(c)) db.createCollection(c);
});

// -----------------------------
// Schema validation (moderate: protège sans te bloquer)
// -----------------------------

// filters
db.runCommand({
  collMod: "filters",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "mappingType", "style", "size", "performance", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "string" },
        mappingType: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["label", "slug", "active", "sortOrder"],
            properties: {
              label: { bsonType: "string" },
              slug: { bsonType: "string" },
              active: { bsonType: "bool" },
              sortOrder: { bsonType: "int" },
            },
          },
        },
        style: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["label", "slug", "active", "sortOrder"],
            properties: {
              label: { bsonType: "string" },
              slug: { bsonType: "string" },
              active: { bsonType: "bool" },
              sortOrder: { bsonType: "int" },
            },
          },
        },
        size: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["label", "slug", "active", "sortOrder"],
            properties: {
              label: { bsonType: "string" },
              slug: { bsonType: "string" },
              active: { bsonType: "bool" },
              sortOrder: { bsonType: "int" },
            },
          },
        },
        performance: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["label", "slug", "active", "sortOrder"],
            properties: {
              label: { bsonType: "string" },
              slug: { bsonType: "string" },
              active: { bsonType: "bool" },
              sortOrder: { bsonType: "int" },
            },
          },
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// tags
db.runCommand({
  collMod: "tags",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "createdAt", "updatedAt"],
      properties: {
        name: { bsonType: "string", minLength: 1, maxLength: 80 },
        slug: { bsonType: "string", minLength: 1, maxLength: 120 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// users (admin + customers later)
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "roles", "status", "createdAt", "updatedAt"],
      properties: {
        email: { bsonType: "string", minLength: 5 },
        passwordHash: { bsonType: ["string", "null"] }, // bcrypt hash
        roles: { bsonType: "array", items: { bsonType: "string" } }, // ["admin"] or ["customer"]
        status: { enum: ["active", "disabled"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// projects (mapping-only)
db.runCommand({
  collMod: "projects",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "slug", "type", "status", "createdAt", "updatedAt"],
      properties: {
        title: { bsonType: "string", minLength: 1, maxLength: 160 },
        slug: { bsonType: "string", minLength: 1, maxLength: 220 },
        titleLower: { bsonType: ["string", "null"] },

        type: { enum: ["mapping"] },

        // UI filters
        mappingType: { bsonType: ["string", "null"] },     // mlo, interior, exterior, ymap...
        style: { bsonType: ["string", "null"] },           // modern, classic, cyber... (extensible)
        size: { bsonType: ["string", "null"] },            // small, medium, massive
        performance: { bsonType: ["string", "null"] },     // optimized, balanced, heavy

        shortDesc: { bsonType: ["string", "null"] },
        description: { bsonType: ["string", "null"] },

        // tags slugs
        tags: { bsonType: ["array", "null"], items: { bsonType: "string" } },

        // pricing now or later
        pricing: {
          bsonType: ["object", "null"],
          properties: {
            cents: { bsonType: ["int", "long", "null"] },
            currency: { bsonType: ["string", "null"] },
          },
        },

        // soft stats (optional)
        stats: {
          bsonType: ["object", "null"],
          properties: {
            views: { bsonType: ["int", "long", "null"] },
            favorites: { bsonType: ["int", "long", "null"] },
            downloads: { bsonType: ["int", "long", "null"] },
          },
        },

        status: { enum: ["draft", "published", "archived"] },
        publishedAt: { bsonType: ["date", "null"] },

        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// project_versions (unlimited)
db.runCommand({
  collMod: "project_versions",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "version", "createdAt", "updatedAt"],
      properties: {
        projectId: { bsonType: "objectId" },
        version: { bsonType: "string", minLength: 1, maxLength: 40 }, // "1.0.0"
        changelog: { bsonType: ["string", "null"] },
        isLatest: { bsonType: ["bool", "null"] },
        releasedAt: { bsonType: ["date", "null"] },

        // mapping metadata per version
        map: {
          bsonType: ["object", "null"],
          properties: {
            game: { bsonType: ["string", "null"] },       // GTA5
            platform: { bsonType: ["string", "null"] },   // FiveM
            locationName: { bsonType: ["string", "null"] },
            coords: {
              bsonType: ["object", "null"],
              properties: {
                x: { bsonType: ["double", "int", "long", "null"] },
                y: { bsonType: ["double", "int", "long", "null"] },
                z: { bsonType: ["double", "int", "long", "null"] },
              },
            },
            dlcsUsed: { bsonType: ["array", "null"], items: { bsonType: "string" } },
            files: { bsonType: ["object", "null"] }, // { ymap:true, ytyp:true, ydr:true, ytd:true }
            streaming: { bsonType: ["object", "null"] }, // { resourceName, installHint }
          },
        },

        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// project_media (unlimited)
db.runCommand({
  collMod: "project_media",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "mediaType", "url", "createdAt", "updatedAt"],
      properties: {
        projectId: { bsonType: "objectId" },
        versionId: { bsonType: ["objectId", "null"] },

        mediaType: { enum: ["image", "video"] },
        provider: { bsonType: ["string", "null"] }, // youtube/vimeo/local/etc
        url: { bsonType: "string", minLength: 5 },
        alt: { bsonType: ["string", "null"] },
        isCover: { bsonType: ["bool", "null"] },
        sortOrder: { bsonType: ["int", "null"] },

        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

// -----------------------------
// Indexes (UI filters + search + sort + admin)
// -----------------------------
db.tags.createIndex({ slug: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

db.projects.createIndex({ slug: 1 }, { unique: true });
db.projects.createIndex({ type: 1, status: 1, publishedAt: -1 });

// filters
db.projects.createIndex({ mappingType: 1, status: 1 });
db.projects.createIndex({ style: 1, status: 1 });
db.projects.createIndex({ size: 1, status: 1 });
db.projects.createIndex({ performance: 1, status: 1 });

// combined filters (your page uses multiple dropdowns)
db.projects.createIndex({ mappingType: 1, style: 1, size: 1, performance: 1, status: 1 });

// sort
db.projects.createIndex({ createdAt: -1 });
db.projects.createIndex({ createdAt: 1 });
db.projects.createIndex({ titleLower: 1 });

// search (simple)
db.projects.createIndex(
  { title: "text", shortDesc: "text", description: "text", tags: "text" },
  { name: "projects_text_search", weights: { title: 10, shortDesc: 5, tags: 4, description: 1 } }
);

// versions/media
db.project_versions.createIndex({ projectId: 1, version: 1 }, { unique: true });
db.project_versions.createIndex({ projectId: 1, isLatest: 1 });
db.project_media.createIndex({ projectId: 1, mediaType: 1, sortOrder: 1 });
db.project_media.createIndex({ projectId: 1, isCover: 1 });

// -----------------------------
// Seed FILTERS (dropdown values) — your UI lists
// -----------------------------
const FILTERS_ID = "mapping-filters-v1";

const filtersDoc = {
  _id: FILTERS_ID,
  mappingType: [
    { label: "MLO", slug: "mlo", active: true, sortOrder: 1 },
    { label: "Interior", slug: "interior", active: true, sortOrder: 2 },
    { label: "Exterior", slug: "exterior", active: true, sortOrder: 3 },
    { label: "YMAP", slug: "ymap", active: true, sortOrder: 4 },
    { label: "YTYP", slug: "ytyp", active: true, sortOrder: 5 },
    { label: "Custom Props", slug: "custom-props", active: true, sortOrder: 6 },
    { label: "Add-on Map", slug: "addon-map", active: true, sortOrder: 7 },
    { label: "Rework", slug: "rework", active: true, sortOrder: 8 },
  ],
  style: [
    { label: "Modern", slug: "modern", active: true, sortOrder: 1 },
    { label: "Classic", slug: "classic", active: true, sortOrder: 2 },
    { label: "Cyber", slug: "cyber", active: true, sortOrder: 3 },
  ],
  size: [
    { label: "Small", slug: "small", active: true, sortOrder: 1 },
    { label: "Medium", slug: "medium", active: true, sortOrder: 2 },
    { label: "Massive", slug: "massive", active: true, sortOrder: 3 },
  ],
  performance: [
    { label: "Optimized", slug: "optimized", active: true, sortOrder: 1 },
    { label: "Balanced", slug: "balanced", active: true, sortOrder: 2 },
    { label: "Heavy", slug: "heavy", active: true, sortOrder: 3 },
  ],
  updatedAt: now(),
};

db.filters.updateOne(
  { _id: FILTERS_ID },
  { $set: filtersDoc, $setOnInsert: { createdAt: now() } },
  { upsert: true }
);

// -----------------------------
// Seed TAGS (controlled list, extend anytime)
// -----------------------------
const tagNames = [
  // mapping types (handy tags for chips too)
  "MLO", "Interior", "Exterior", "YMAP", "YTYP", "Custom Props",

  // dropdown-like tags
  "Modern", "Classic", "Cyber",
  "Small", "Medium", "Massive",
  "Optimized", "Balanced", "Heavy",

  // platform
  "GTA", "FiveM",

  // quality / extras
  "RP Ready", "LOD", "Luxury",

  "featured", "popular", "new",
];

db.tags.bulkWrite(
  tagNames.map((name) => {
    const slug = slugify(name);
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: { name, slug, updatedAt: now() },
          $setOnInsert: { createdAt: now() },
        },
        upsert: true,
      },
    };
  })
);

// -----------------------------
// Seed ADMIN (future admin panel)
// -----------------------------
// Provide ADMIN_EMAIL and ADMIN_PASSWORD_HASH via env for a usable account.
// If hash missing: account is created disabled.
const ADMIN_EMAIL = env("ADMIN_EMAIL", "admin@local.dev");
const ADMIN_PASSWORD_HASH = env("ADMIN_PASSWORD_HASH", null);

db.users.updateOne(
  { email: ADMIN_EMAIL },
  {
    $set: {
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD_HASH,
      roles: ["admin"],
      status: ADMIN_PASSWORD_HASH ? "active" : "disabled",
      updatedAt: now(),
    },
    $setOnInsert: { createdAt: now() },
  },
  { upsert: true }
);

// -----------------------------
// Seed PROJECTS + VERSION + MEDIA (example)
// -----------------------------
const seedProjects = [
  {
    title: "Pillbox Hospital",
    slug: "pillbox-hospital",
    shortDesc: "Large hospital MLO (interior + exterior) optimized for RP.",
    description:
      "Full rebuild of Pillbox: interiors/exteriors, props rework, optimized collisions, clean LODs, streamed assets ready for FiveM.",

    mappingType: "mlo",
    style: "modern",
    size: "massive",
    performance: "optimized",

    pricing: { cents: 13000, currency: "USD" },

    tags: ["mlo","interior","exterior","optimized","massive","modern","gta","fivem","lod","rp-ready"],

    cover: "https://picsum.photos/900/500?random=10",
    gallery: [
      "https://picsum.photos/900/500?random=11",
      "https://picsum.photos/900/500?random=12",
    ],
    videos: [
      { provider: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    ],

    version: {
      version: "1.0.0",
      changelog: "Initial release.",
      map: {
        game: "GTA5",
        platform: "FiveM",
        locationName: "Pillbox Hill",
        coords: { x: null, y: null, z: null },
        dlcsUsed: ["vanilla-friendly"],
        files: { ymap: true, ytyp: true, ydr: true, ytd: true },
        streaming: { resourceName: "pillbox_hospital", installHint: "ensure pillbox_hospital" },
      },
    },
  },
  {
    title: "Luxury Penthouse Interior",
    slug: "luxury-penthouse-interior",
    shortDesc: "Modern penthouse interior with lighting + performance focus.",
    description:
      "High-end interior build with dynamic lighting, high-quality props, and multiple rooms optimized for RP usage.",

    mappingType: "interior",
    style: "modern",
    size: "medium",
    performance: "optimized",

    pricing: { cents: 13000, currency: "USD" },

    tags: ["mlo","interior","luxury","optimized","modern","gta","fivem","rp-ready"],

    cover: "https://picsum.photos/900/500?random=21",
    gallery: [],
    videos: [],

    version: {
      version: "1.0.0",
      changelog: "Initial release.",
      map: {
        game: "GTA5",
        platform: "FiveM",
        locationName: "Custom Interior",
        dlcsUsed: ["vanilla-friendly"],
        files: { ymap: true, ytyp: true, ydr: true, ytd: true },
        streaming: { resourceName: "luxury_penthouse", installHint: "ensure luxury_penthouse" },
      },
    },
  },
];

seedProjects.forEach((p) => {
  const projectDoc = {
    title: p.title,
    slug: p.slug,
    titleLower: (p.title || "").toLowerCase(),
    shortDesc: p.shortDesc || null,
    description: p.description || null,

    type: "mapping",

    mappingType: p.mappingType || null,
    style: p.style || null,
    size: p.size || null,
    performance: p.performance || null,

    pricing: p.pricing || null,
    tags: normalizeSlugs(p.tags || []),

    image: p.cover || null,

    stats: { views: 0, favorites: 0, downloads: 0 },

    status: "published",
    publishedAt: now(),
    updatedAt: now(),
  };

  // upsert project
  db.projects.updateOne(
    { slug: projectDoc.slug },
    { $set: projectDoc, $setOnInsert: { createdAt: now() } },
    { upsert: true }
  );

  // fetch project _id
  const created = db.projects.findOne({ slug: projectDoc.slug }, { _id: 1 });
  const projectId = created._id;

  // upsert version
  const versionDoc = {
    projectId,
    version: p.version?.version || "1.0.0",
    changelog: p.version?.changelog || null,
    isLatest: true,
    releasedAt: now(),
    map: p.version?.map || null,
    updatedAt: now(),
  };

  // set other versions isLatest=false (safe)
  db.project_versions.updateMany(
    { projectId, isLatest: true },
    { $set: { isLatest: false, updatedAt: now() } }
  );

  db.project_versions.updateOne(
    { projectId, version: versionDoc.version },
    { $set: versionDoc, $setOnInsert: { createdAt: now() } },
    { upsert: true }
  );

  const v = db.project_versions.findOne({ projectId, version: versionDoc.version }, { _id: 1 });
  const versionId = v?._id || null;

  // upsert media (cover + gallery + videos)
  const media = [];

  if (p.cover) {
    media.push({
      projectId,
      versionId,
      mediaType: "image",
      provider: null,
      url: p.cover,
      alt: `${p.title} cover`,
      isCover: true,
      sortOrder: 1,
    });
  }

  (p.gallery || []).forEach((url, idx) => {
    media.push({
      projectId,
      versionId,
      mediaType: "image",
      provider: null,
      url,
      alt: `${p.title} gallery ${idx + 1}`,
      isCover: false,
      sortOrder: 2 + idx,
    });
  });

  (p.videos || []).forEach((vid, idx) => {
    media.push({
      projectId,
      versionId,
      mediaType: "video",
      provider: vid.provider || null,
      url: vid.url,
      alt: `${p.title} video ${idx + 1}`,
      isCover: false,
      sortOrder: 100 + idx,
    });
  });

  media.forEach((m) => {
    // prevent duplicates by (projectId + url)
    db.project_media.updateOne(
      { projectId: m.projectId, url: m.url },
      { $set: { ...m, updatedAt: now() }, $setOnInsert: { createdAt: now() } },
      { upsert: true }
    );
  });
});

print(`[mongo-init] "${DB_NAME}" seeded ✅ filters/tags/projects/versions/media/users`);
