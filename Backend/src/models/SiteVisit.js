import { Schema, model } from "mongoose";

const siteVisitSchema = new Schema({
  date: { type: String, required: true, unique: true, index: true }, // "2026-03-17"
  visits: { type: Number, default: 0 },         // total page loads that day
  uniqueVisitors: { type: Number, default: 0 }, // unique IPs that day
  ipHashes: { type: [String], default: [] },    // hashed IPs (RGPD: no raw IPs stored)
});

export default model("SiteVisit", siteVisitSchema);
