import SiteSettings from "../models/SiteSettings.js";

const DEFAULTS = { _id: "singleton", discord: "", github: "", email: "", marketplace: "", tiktok: "", youtube: "" };

export async function getSettings(req, res) {
  try {
    const doc = await SiteSettings.findById("singleton").lean();
    res.json(doc || DEFAULTS);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const { discord, github, email, marketplace, tiktok, youtube } = req.body;
    const doc = await SiteSettings.findByIdAndUpdate(
      "singleton",
      { $set: { discord, github, email, marketplace, tiktok, youtube } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
