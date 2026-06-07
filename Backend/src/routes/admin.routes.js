import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/stats", requireAuth, getAdminStats);

export default router;
