import "dotenv/config";
import { validateEnv } from "./config/validateEnv.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startBot } from "./services/discord.bot.js";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

validateEnv();

await connectDB();
startBot();

// Auto-create admin from env vars if not exists
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({ email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash });
    console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL}`);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
