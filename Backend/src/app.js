import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import apiRoutes from "./routes/index.js";

const app = express();

// CORS — accepte toutes les origines en dev (tunnel inclus)
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Cache-Control middleware
app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    // Données publiques : 60s cache, revalidation en arrière-plan
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  } else {
    // Mutations : jamais de cache
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
