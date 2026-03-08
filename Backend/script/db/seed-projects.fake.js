import "dotenv/config";
import mongoose from "mongoose";

// Usage:
//   node script/db/seed-projects.fake.js            -> génère 36 projets
//   node script/db/seed-projects.fake.js 40         -> génère 40 projets
//   node script/db/seed-projects.fake.js --force    -> ignore la vérif et seed quand même
//   node script/db/seed-projects.fake.js 40 --force -> 40 projets en forçant
//
// Requis: MONGO_URI dans .env (ex: mongodb://localhost:27017/portfolio_mapping)

function now() { return new Date(); }

function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MAPPING_TYPES = ["mlo", "interior", "exterior", "ymap", "ytyp", "custom-props", "addon-map", "rework"];
const STYLES = ["modern", "classic", "cyber"];
const SIZES = ["small", "medium", "massive"];
const PERFS = ["optimized", "balanced", "heavy"];

// Tags “safe” (slugs) : colle à ton init existant
const TAG_POOL = [
  "mlo","interior","exterior","ymap","ytyp","custom-props",
  "modern","classic","cyber",
  "small","medium","massive",
  "optimized","balanced","heavy",
  "gta","fivem","rp-ready","lod","luxury",
  "featured","popular","new"
];

const TITLE_PREFIX = [
  "Pillbox", "Vespucci", "Del Perro", "Mirror Park", "Sandy Shores", "Grapeseed",
  "Vinewood", "Davis", "Rancho", "Paleto", "Legion Square", "Little Seoul"
];

const TITLE_CORE = [
  "Hospital", "Police Station", "Bunker", "Nightclub", "Mechanic Shop", "Garage",
  "Penthouse", "Underground Lab", "Warehouse", "Mansion", "Tattoo Studio",
  "Cyber Hub", "Car Meet Spot", "Drug Lab", "Beach House", "Arcade"
];

const TITLE_SUFFIX = [
  "Rework", "MLO", "Interior", "Exterior Pack", "V2", "Enhanced", "Optimized", "RP Edition"
];

function makeTitle() {
  return `${pick(TITLE_PREFIX)} ${pick(TITLE_CORE)} ${pick(TITLE_SUFFIX)}`.replace(/\s+/g, " ").trim();
}

function makeDesc(title, mappingType, style, size, performance) {
  return (
    `${title} — ${mappingType.toUpperCase()} ${style} • ${size} • ${performance}. ` +
    `Build prêt pour FiveM: collisions propres, LOD soignés, props optimisées et streaming clean.`
  );
}

async function ensureUniqueSlug(col, baseSlug) {
  let slug = baseSlug;
  let i = 2;
  while (await col.findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }
  return slug;
}

function parseArgs(argv) {
  const force = argv.includes("--force");
  const numberArg = argv.find((a) => /^\d+$/.test(a));
  const target = Math.min(40, Math.max(30, Number(numberArg) || 36));
  return { force, target };
}

async function main() {
  const { force, target } = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI manquant dans .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const projectsCol = db.collection("projects");
  const versionsCol = db.collection("project_versions");
  const mediaCol = db.collection("project_media");

  // ✅ GARDE-FOU: si déjà des projets, on skip (sauf --force)
  const existingCount = await projectsCol.estimatedDocumentCount();
  if (!force && existingCount > 0) {
    console.log(`🟡 Seed skipped: projects déjà présents (${existingCount}).`);
    console.log(`   Tip: utilise --force si tu veux reseed quand même.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  let created = 0;

  while (created < target) {
    const title = makeTitle();
    const base = slugify(title);

    const slug = await ensureUniqueSlug(projectsCol, base);

    const mappingType = pick(MAPPING_TYPES);
    const style = pick(STYLES);
    const size = pick(SIZES);
    const performance = pick(PERFS);

    const shortDesc = `Mapping ${mappingType} ${style} — ${performance}.`;
    const description = makeDesc(title, mappingType, style, size, performance);

    const tags = [
      mappingType,
      style,
      size,
      performance,
      "gta",
      "fivem",
      ...sample(TAG_POOL, randInt(2, 5)),
    ].map(slugify);

    const projectId = new mongoose.Types.ObjectId();
    const projectDoc = {
      _id: projectId,
      title,
      slug,
      titleLower: title.toLowerCase(),
      type: "mapping",

      mappingType,
      style,
      size,
      performance,

      shortDesc,
      description,

      tags: Array.from(new Set(tags)),

      pricing: { cents: randInt(0, 25000), currency: "USD" },
      stats: { views: randInt(0, 5000), favorites: randInt(0, 400), downloads: randInt(0, 1200) },

      status: "published",
      publishedAt: now(),

      createdAt: now(),
      updatedAt: now(),
    };

    const versionId = new mongoose.Types.ObjectId();
    const versionDoc = {
      _id: versionId,
      projectId,
      version: "1.0.0",
      changelog: "Initial fake release.",
      isLatest: true,
      releasedAt: now(),
      map: {
        game: "GTA5",
        platform: "FiveM",
        locationName: pick(TITLE_PREFIX),
        coords: { x: null, y: null, z: null },
        dlcsUsed: ["vanilla-friendly"],
        files: { ymap: true, ytyp: true, ydr: true, ytd: true },
        streaming: { resourceName: slug.replace(/-/g, "_"), installHint: `ensure ${slug.replace(/-/g, "_")}` },
      },
      createdAt: now(),
      updatedAt: now(),
    };

    const coverUrl = `https://picsum.photos/1200/700?random=${randInt(1, 9999)}`;
    const gallery1 = `https://picsum.photos/1200/700?random=${randInt(1, 9999)}`;
    const gallery2 = `https://picsum.photos/1200/700?random=${randInt(1, 9999)}`;

    const medias = [
      {
        _id: new mongoose.Types.ObjectId(),
        projectId,
        versionId,
        mediaType: "image",
        provider: null,
        url: coverUrl,
        alt: `${title} cover`,
        isCover: true,
        sortOrder: 1,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        projectId,
        versionId,
        mediaType: "image",
        provider: null,
        url: gallery1,
        alt: `${title} gallery 1`,
        isCover: false,
        sortOrder: 2,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        projectId,
        versionId,
        mediaType: "image",
        provider: null,
        url: gallery2,
        alt: `${title} gallery 2`,
        isCover: false,
        sortOrder: 3,
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    if (Math.random() < 0.25) {
      medias.push({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        versionId,
        mediaType: "video",
        provider: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        alt: `${title} video`,
        isCover: false,
        sortOrder: 100,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    try {
      await projectsCol.insertOne(projectDoc);
      await versionsCol.insertOne(versionDoc);
      await mediaCol.insertMany(medias, { ordered: false });

      created += 1;
      console.log(`✅ +1 (${created}/${target})`, slug);
    } catch (e) {
      console.warn("⚠️ Skip (collision/validator?)", e?.message || e);
    }
  }

  console.log(`\n🎉 Done: inserted ${created} fake projects`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});