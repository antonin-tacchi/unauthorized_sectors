import * as Ticket from "../models/Ticket.js";
import { sendTicketToDiscord, sendStatusUpdateToDiscord } from "../services/discord.service.js";
import { createTicketChannel, archiveTicketChannel, deleteTicketChannel } from "../services/discord.bot.js";

// POST /api/tickets  (public)
export async function createTicket(req, res) {
  const { email, discord, subject, budget, timeline, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ message: "email, subject, and message are required." });
  }

  let ticket;
  try {
    ticket = await Ticket.create({ email, discord, subject, budget, timeline, message });
  } catch (err) {
    return res.status(400).json({ message: "Erreur lors de la création du ticket." });
  }

  // Fire-and-forget Discord notifications
  sendTicketToDiscord(ticket)
    .then((msgId) => { if (msgId) Ticket.setDiscordMessageId(ticket.id, msgId); })
    .catch((e) => console.error("sendTicketToDiscord error:", e.message));

  createTicketChannel(ticket)
    .then((channelId) => { if (channelId) Ticket.setDiscordChannelId(ticket.id, channelId); })
    .catch((e) => console.error("createTicketChannel error:", e.message));

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
  const { status, priority, adminNotes } = req.body;
  const VALID_STATUS = ["open", "in-progress", "resolved", "closed"];
  const VALID_PRIORITY = ["low", "medium", "high"];
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${VALID_STATUS.join(", ")}` });
  }

  const ticket = await Ticket.updateStatus(req.params.id, {
    status,
    priority: VALID_PRIORITY.includes(priority) ? priority : undefined,
    adminNotes,
  });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });

  sendStatusUpdateToDiscord(ticket, status, adminNotes).catch((e) => console.error("sendStatusUpdateToDiscord error:", e.message));

  if (status === "closed" && ticket.discordChannelId) {
    archiveTicketChannel(ticket.discordChannelId).catch((e) => console.error("archiveTicketChannel error:", e.message));
  }

  return res.json(ticket);
}

// DELETE /api/tickets/:id  (admin)
export async function deleteTicket(req, res) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  await Ticket.remove(req.params.id);
  if (ticket.discordChannelId) deleteTicketChannel(ticket.discordChannelId).catch(() => {});
  return res.json({ message: "Ticket deleted." });
}

// DELETE /api/tickets/bulk  (admin)
export async function bulkDeleteTickets(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "ids array required." });
  }
  const tickets = await Ticket.findByIds(ids);
  const count = await Ticket.removeMany(ids);
  for (const ticket of tickets) {
    if (ticket.discordChannelId) deleteTicketChannel(ticket.discordChannelId).catch(() => {});
  }
  return res.json({ deleted: count });
}
