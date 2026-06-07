import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { uploadModel } from "../controllers/upload.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB max
});

const router = Router();

router.post("/model", requireAuth, upload.single("file"), uploadModel);

export default router;
