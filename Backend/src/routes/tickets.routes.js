import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  deleteTicket,
} from "../controllers/ticket.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many ticket submissions, please try again later." },
});

router.post("/", ticketLimiter, createTicket);
router.get("/", requireAuth, getTickets);
router.get("/:id", requireAuth, getTicketById);
router.patch("/:id/status", requireAuth, updateTicketStatus);
router.delete("/:id", requireAuth, deleteTicket);

export default router;
