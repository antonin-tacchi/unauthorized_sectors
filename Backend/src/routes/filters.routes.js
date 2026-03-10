import { Router } from "express";
import { getFilters, updateFilters, getTags, deleteTag } from "../controllers/filters.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/",         getFilters);
router.put("/",         requireAuth, updateFilters);
router.get("/tags",     requireAuth, getTags);
router.delete("/tags/:tag", requireAuth, deleteTag);

export default router;
