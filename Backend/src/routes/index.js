import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import projectsRoutes from "./projects.routes.js";
import contactRoutes from "./contact.routes.js";
import authRoutes from "./auth.routes.js";
import filtersRoutes from "./filters.routes.js";
import mediaRoutes from "./media.routes.js";
import uploadRoutes from "./upload.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/projects", projectsRoutes);
router.use("/contact", contactRoutes);
router.use("/auth", authRoutes);
router.use("/filters", filtersRoutes);
router.use("/media", mediaRoutes);
router.use("/upload", uploadRoutes);
router.use("/settings", settingsRoutes);
router.use("/admin", adminRoutes);

export default router;
