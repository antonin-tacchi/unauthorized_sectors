import { Router } from "express";
import projectsRoutes from "./projects.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/projects", projectsRoutes);

export default router;
