import "dotenv/config";
import mongoose from "mongoose";
import slugify from "slugify";
import Project from "../../src/models/Project.js";

const rawProjects = [
  {
    title: "Military Base MLO",
    type: "mapping",
    description:
      "Base militaire immersive créée pour FiveM avec zone sécurisée, garage blindé et contrôle d'accès.",
    image: "https://picsum.photos/1000/600?random=1",
    tags: ["fivem", "mapping", "mlo", "gta"],
  },
  {
    title: "Luxury Penthouse Interior",
    type: "mapping",
    description:
      "Penthouse moderne avec vue panoramique, éclairage dynamique et optimisation performance.",
    image: "https://picsum.photos/1000/600?random=2",
    tags: ["interior", "luxury", "gta", "design"],
  },
  {
    title: "Portfolio React",
    type: "web",
    description:
      "Site portfolio développé en React, Tailwind et NodeJS avec backend MongoDB.",
    image: "https://picsum.photos/1000/600?random=3",
    tags: ["react", "tailwind", "node", "mongodb"],
  },
  {
    title: "Discord-like Chat App",
    type: "web",
    description:
      "Application temps réel avec WebSocket permettant discussion et appels vocaux.",
    image: "https://picsum.photos/1000/600?random=4",
    tags: ["websocket", "chat", "node", "realtime"],
  },
  {
    title: "GTA Underground Bunker",
    type: "mapping",
    description:
      "Bunker souterrain sécurisé avec système de portes animées et lumières dynamiques.",
    image: "https://picsum.photos/1000/600?random=5",
    tags: ["gta", "bunker", "security", "mlo"],
  },
  {
    title: "E-Commerce Instant Gaming Clone",
    type: "web",
    description:
      "Site e-commerce inspiré d’Instant Gaming avec panier, filtres et dashboard admin.",
    image: "https://picsum.photos/1000/600?random=6",
    tags: ["ecommerce", "php", "mysql", "frontend"],
  },
];

function baseSlug(title) {
  return slugify(title, { lower: true, strict: true, trim: true });
}

async function makeUniqueSlug(title, taken) {
  const base = baseSlug(title);
  let slug = base;
  let i = 2;

  // évite collision dans le même seed
  while (taken.has(slug) || (await Project.exists({ slug }))) {
    slug = `${base}-${i}`;
    i += 1;
  }

  taken.add(slug);
  return slug;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const taken = new Set();
  const projects = [];

  for (const p of rawProjects) {
    const slug = await makeUniqueSlug(p.title, taken);
    projects.push({ ...p, slug });
  }

  const count = await Project.countDocuments();
  if (count > 0) {
    console.log(`✅ Seed skipped (projects already exist: ${count})`);
    process.exit(0);
  }

  await Project.insertMany(projects);
  console.log("✅ Seed done:", projects.length, "projects");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
