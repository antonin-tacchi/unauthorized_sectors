const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const PRIORITY_COLORS = { low: 0x22c55e, medium: 0xf59e0b, high: 0xef4444 };
const STATUS_COLORS = {
  open: 0x6b5cff,
  "in-progress": 0xf59e0b,
  resolved: 0x22c55e,
  closed: 0x6b7280,
};

export async function sendTicketToDiscord(ticket) {
  if (!WEBHOOK_URL) return;

  const payload = {
    embeds: [
      {
        title: `🎫 New Ticket — ${ticket.ticketNumber}`,
        color: PRIORITY_COLORS[ticket.priority] ?? 0x6b5cff,
        fields: [
          { name: "Subject", value: ticket.subject, inline: true },
          { name: "Email", value: ticket.email, inline: true },
          ...(ticket.discord ? [{ name: "Discord", value: ticket.discord, inline: true }] : []),
          ...(ticket.budget ? [{ name: "Budget", value: ticket.budget, inline: true }] : []),
          ...(ticket.timeline ? [{ name: "Délai", value: ticket.timeline, inline: true }] : []),
          { name: "Message", value: ticket.message.slice(0, 1024) },
        ],
        footer: { text: `Ticket ${ticket.ticketNumber}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(`${WEBHOOK_URL}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.id ?? null;
    }
  } catch {
    // Non-critical — ticket is still saved
  }
  return null;
}

export async function sendStatusUpdateToDiscord(ticket, newStatus, adminNotes) {
  if (!WEBHOOK_URL) return;

  const payload = {
    embeds: [
      {
        title: `🔄 Ticket ${ticket.ticketNumber} — Status Updated`,
        color: STATUS_COLORS[newStatus] ?? 0x6b7280,
        fields: [
          { name: "New Status", value: newStatus, inline: true },
          { name: "Subject", value: ticket.subject, inline: true },
          ...(adminNotes ? [{ name: "Admin Notes", value: adminNotes }] : []),
        ],
        footer: { text: `Ticket ${ticket.ticketNumber}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-critical
  }
}
