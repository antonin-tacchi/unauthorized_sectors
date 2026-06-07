import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../../src/models/Admin.js";

const EMAIL = process.argv[2] || process.env.ADMIN_EMAIL;
const PASSWORD = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node script/db/create-admin.js <email> <password>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const passwordHash = await bcrypt.hash(PASSWORD, 12);

const existing = await Admin.findOne({ email: EMAIL.toLowerCase() });
if (existing) {
  existing.passwordHash = passwordHash;
  await existing.save();
  console.log(`✅ Admin updated: ${EMAIL}`);
} else {
  await Admin.create({ email: EMAIL.toLowerCase(), passwordHash });
  console.log(`✅ Admin created: ${EMAIL}`);
}

await mongoose.disconnect();
