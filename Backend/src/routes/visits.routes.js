import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { trackVisit } from "../controllers/visits.controller.js";

const router = Router();

// Max 10 appels par IP par 10 min (protection spam)
const trackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/track", trackLimiter, trackVisit);

export default router;
