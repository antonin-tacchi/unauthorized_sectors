import { Router } from "express";
import {
  createProject,
  listProjects,
  getProjectBySlug,
} from "../controllers/projects.controller.js";

const router = Router();

router.post("/", createProject);
router.get("/", listProjects);
router.get("/:slug", getProjectBySlug);

export default router;
