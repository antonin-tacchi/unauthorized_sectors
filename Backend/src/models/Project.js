import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    slug: { type: String, required: true, unique: true, index: true },

    // Site mapping-only => toujours "mapping"
    type: { type: String, required: true, default: "mapping", index: true },

    // Filters UI
    mappingType: { type: String, default: "", index: true },   // mlo, interior, ymap...
    style: { type: String, default: "", index: true },         // modern, classic, cyber...
    size: { type: String, default: "", index: true },          // small, medium, massive
    performance: { type: String, default: "", index: true },   // optimized, balanced, heavy

    // For title sort
    titleLower: { type: String, default: "", index: true },

    // Content
    shortDesc: { type: String, default: "" },
    description: { type: String, default: "" },

    // Keep this for now (simple UI), later you'll replace by project_media
    image: { type: String, default: "" },

    tags: [{ type: String, default: "" }],

    // Optional selling later
    pricing: {
      cents: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },

    status: { type: String, default: "published", index: true }, // draft|published|archived
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Text search (optional but useful)
projectSchema.index(
  { title: "text", shortDesc: "text", description: "text", tags: "text" },
  { weights: { title: 10, shortDesc: 5, tags: 4, description: 1 } }
);

export default mongoose.model("Project", projectSchema);
