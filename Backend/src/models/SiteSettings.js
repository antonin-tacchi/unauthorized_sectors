import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    discord:     { type: String, default: "" },
    github:      { type: String, default: "" },
    email:       { type: String, default: "" },
    marketplace: { type: String, default: "" },
    tiktok:      { type: String, default: "" },
    youtube:     { type: String, default: "" },
  },
  { _id: false, versionKey: false }
);

export default mongoose.model("SiteSettings", schema);
