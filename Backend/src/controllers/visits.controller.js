import crypto from "crypto";
import SiteVisit from "../models/SiteVisit.js";

function hashIp(ip) {
  return crypto.createHash("sha256").update(ip + (process.env.IP_SALT || "salt")).digest("hex").slice(0, 16);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "2026-03-17"
}

export async function trackVisit(req, res) {
  try {
    const date = todayStr();
    const ipHash = hashIp(req.ip || "unknown");

    // Increment visits count always, uniqueVisitors only if new IP today
    const doc = await SiteVisit.findOne({ date });

    if (!doc) {
      await SiteVisit.create({
        date,
        visits: 1,
        uniqueVisitors: 1,
        ipHashes: [ipHash],
      });
    } else {
      const isNew = !doc.ipHashes.includes(ipHash);
      await SiteVisit.updateOne(
        { date },
        {
          $inc: { visits: 1, ...(isNew ? { uniqueVisitors: 1 } : {}) },
          ...(isNew ? { $push: { ipHashes: ipHash } } : {}),
        }
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    // Silent fail — tracking should never break the site
    return res.json({ ok: false });
  }
}
