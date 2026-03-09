import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createProject,
  listProjects,
  getProjectBySlug,
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Rate limit strict : 10 req / 15 min par IP sur les écritures
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many write requests, please try again later." },
});

router.get("/", listProjects);
router.get("/:slug", getProjectBySlug);
router.post("/", writeLimiter, requireAuth, createProject);

export default router;
