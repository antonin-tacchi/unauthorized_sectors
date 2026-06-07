import "dotenv/config";
import { validateEnv } from "./config/validateEnv.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initMySQL } from "./db/mysql.js";

validateEnv();

await connectDB();
await initMySQL();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
