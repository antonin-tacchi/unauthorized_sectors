import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createProject,
  updateProject,
  deleteProject,
  listProjects,
  getProjectBySlug,
  getProjectById,
  getProjectStats,
  incrementView,
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
router.get("/stats", getProjectStats);
router.get("/id/:id", requireAuth, getProjectById);
router.get("/:slug", getProjectBySlug);
router.patch("/:slug/view", incrementView);
router.post("/", writeLimiter, requireAuth, createProject);
router.put("/:id", writeLimiter, requireAuth, updateProject);
router.delete("/:id", writeLimiter, requireAuth, deleteProject);

export default router;
