import mongoose from "mongoose";

const { Schema } = mongoose;

const projectMediaSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Project" },
    versionId: { type: Schema.Types.ObjectId, default: null, index: true },

    mediaType: { type: String, enum: ["image", "video"], required: true, index: true },
    provider: { type: String, default: null },

    url: { type: String, required: true },
    alt: { type: String, default: "" },

    role: { type: String, enum: ["gallery", "cover", "before", "after"], default: "gallery" },

    isCover: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "project_media" }
);

projectMediaSchema.index({ projectId: 1, url: 1 }, { unique: true });

export default mongoose.model("ProjectMedia", projectMediaSchema);