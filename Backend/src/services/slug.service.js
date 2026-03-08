import slugify from "slugify";
import Project from "../models/Project.js";

export async function generateUniqueSlug(title) {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  let slug = base;
  let i = 2;

  while (await Project.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
  }

  return slug;
}
