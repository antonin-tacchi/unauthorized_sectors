import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getProjectMedia,
  createMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/media.controller.js";

const router = Router();

router.get("/", getProjectMedia);
router.post("/", requireAuth, createMedia);
router.put("/:id", requireAuth, updateMedia);
router.delete("/:id", requireAuth, deleteMedia);

export default router;
