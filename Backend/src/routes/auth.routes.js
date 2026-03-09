import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

const router = Router();

router.post("/login", loginLimiter, login);
router.get("/me", requireAuth, me);

export default router;
