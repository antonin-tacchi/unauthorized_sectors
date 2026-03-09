import { Router } from "express";
import projectsRoutes from "./projects.routes.js";
import contactRoutes from "./contact.routes.js";
import authRoutes from "./auth.routes.js";
import filtersRoutes from "./filters.routes.js";
import mediaRoutes from "./media.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/projects", projectsRoutes);
router.use("/contact", contactRoutes);
router.use("/auth", authRoutes);
router.use("/filters", filtersRoutes);
router.use("/media", mediaRoutes);

export default router;
