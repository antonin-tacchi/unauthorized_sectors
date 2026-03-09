import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Rate limit global : 100 req / 15 min par IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
