import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { sendContact } from "../controllers/contact.controller.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many contact requests, please try again later." },
});

router.post("/", contactLimiter, sendContact);

export default router;
