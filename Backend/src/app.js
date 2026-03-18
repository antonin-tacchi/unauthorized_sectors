import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import apiRoutes from "./routes/index.js";

const app = express();

// Trust proxy (dev tunnels, reverse proxies)
app.set("trust proxy", 1);

// CORS — whitelist basée sur ALLOWED_ORIGINS en production
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean)
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (ex: Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Cache-Control middleware
app.use("/api", (req, res, next) => {
  // Routes tickets + settings (données temps-réel) : jamais de cache
  if (req.path.startsWith("/tickets") || req.path.startsWith("/settings")) {
    res.set("Cache-Control", "no-store");
  } else if (req.method === "GET") {
    // Données publiques : 60s cache, revalidation en arrière-plan
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  } else {
    res.set("Cache-Control", "no-store");
  }
  next();
});

// Rate limit global : 200 req / 15 min par IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  })
);

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

export default app;
