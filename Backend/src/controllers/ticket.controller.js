import Ticket from "../models/Ticket.js";
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
    const msg = err.name === "ValidationError"
      ? Object.values(err.errors).map((e) => e.message).join(", ")
      : "Erreur lors de la création du ticket.";
    return res.status(400).json({ message: msg });
  }

  // Fire-and-forget Discord notifications
  sendTicketToDiscord(ticket)
    .then((msgId) => {
      if (msgId) Ticket.findByIdAndUpdate(ticket._id, { discordMessageId: msgId }).exec();
    })
    .catch((e) => console.error("createTicketChannel catch:", e.message));

  createTicketChannel(ticket)
    .then((channelId) => {
      if (channelId) Ticket.findByIdAndUpdate(ticket._id, { discordChannelId: channelId }).exec();
    })
    .catch((e) => console.error("createTicketChannel catch:", e.message));

  return res.status(201).json({
    ticketNumber: ticket.ticketNumber,
    message: "Ticket created successfully.",
  });
}

// GET /api/tickets  (admin)
export async function getTickets(req, res) {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const [tickets, total, countByStatus] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Ticket.countDocuments(filter),
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(countByStatus.map((s) => [s._id, s.count]));

  return res.json({ tickets, total, page: Number(page), statusCounts });
}

// GET /api/tickets/:id  (admin)
export async function getTicketById(req, res) {
  const ticket = await Ticket.findById(req.params.id).lean();
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

  const update = { status };
  if (priority && VALID_PRIORITY.includes(priority)) update.priority = priority;
  if (adminNotes !== undefined) update.adminNotes = adminNotes;
  if (status === "resolved") update.resolvedAt = new Date();

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });

  sendStatusUpdateToDiscord(ticket, status, adminNotes).catch((e) => console.error("createTicketChannel catch:", e.message));

  // Archive Discord channel when ticket is closed
  if (status === "closed" && ticket.discordChannelId) {
    archiveTicketChannel(ticket.discordChannelId).catch((e) => console.error("createTicketChannel catch:", e.message));
  }

  return res.json(ticket);
}

// DELETE /api/tickets/:id  (admin)
export async function deleteTicket(req, res) {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  if (ticket.discordChannelId) deleteTicketChannel(ticket.discordChannelId).catch(() => {});
  return res.json({ message: "Ticket deleted." });
}

// DELETE /api/tickets/bulk  (admin)
export async function bulkDeleteTickets(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "ids array required." });
  }
  const tickets = await Ticket.find({ _id: { $in: ids } }).lean();
  await Ticket.deleteMany({ _id: { $in: ids } });
  for (const ticket of tickets) {
    if (ticket.discordChannelId) deleteTicketChannel(ticket.discordChannelId).catch(() => {});
  }
  return res.json({ deleted: tickets.length });
}
