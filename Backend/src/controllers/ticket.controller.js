import * as Ticket from "../models/Ticket.js";
import { sendTicketToDiscord, sendStatusUpdateToDiscord } from "../services/discord.service.js";

// POST /api/tickets  (public)
export async function createTicket(req, res) {
  const { email, discord, subject, priority, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ message: "email, subject, and message are required." });
  }

  const ticket = await Ticket.create({ email, discord, subject, priority, message });

  // Fire-and-forget Discord notification
  sendTicketToDiscord(ticket)
    .then((msgId) => {
      if (msgId) Ticket.setDiscordMessageId(ticket.id, msgId);
    })
    .catch(() => {});

  return res.status(201).json({
    ticketNumber: ticket.ticketNumber,
    message: "Ticket created successfully.",
  });
}

// GET /api/tickets  (admin)
export async function getTickets(req, res) {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const { tickets, total, statusCounts } = await Ticket.find({ status, priority, page, limit });
  return res.json({ tickets, total, page: Number(page), statusCounts });
}

// GET /api/tickets/:id  (admin)
export async function getTicketById(req, res) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  return res.json(ticket);
}

// PATCH /api/tickets/:id/status  (admin)
export async function updateTicketStatus(req, res) {
  const { status, adminNotes } = req.body;
  const VALID = ["open", "in-progress", "resolved", "closed"];
  if (!VALID.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${VALID.join(", ")}` });
  }

  const ticket = await Ticket.updateStatus(req.params.id, { status, adminNotes });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });

  sendStatusUpdateToDiscord(ticket, status, adminNotes).catch(() => {});

  return res.json(ticket);
}

// DELETE /api/tickets/:id  (admin)
export async function deleteTicket(req, res) {
  const deleted = await Ticket.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Ticket not found." });
  return res.json({ message: "Ticket deleted." });
}
