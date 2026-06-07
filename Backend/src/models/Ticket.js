/**
 * Ticket data-access layer — backed by MySQL (tickets_db.tickets).
 * Provides a simple API used by ticket.controller.js.
 */
import pool from "../db/mysql.js";

// ── helpers ────────────────────────────────────────────────────────────────

/** Generate the next ticket number: TK-0001, TK-0002, … */
async function nextTicketNumber(conn) {
  const [rows] = await conn.query(
    "SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1"
  );
  if (!rows.length) return "TK-0001";
  const n = parseInt(rows[0].ticket_number.replace("TK-", ""), 10);
  return `TK-${String((isNaN(n) ? 0 : n) + 1).padStart(4, "0")}`;
}

/** Map a snake_case DB row to the camelCase shape the rest of the app expects. */
function toTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    email: row.email,
    discord: row.discord,
    subject: row.subject,
    priority: row.priority,
    message: row.message,
    status: row.status,
    discordMessageId: row.discord_message_id,
    adminNotes: row.admin_notes,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * Create a new ticket.
 * @returns {Promise<object>} The created ticket object.
 */
export async function create({ email, discord = "", subject, priority = "low", message }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ticketNumber = await nextTicketNumber(conn);
    await conn.query(
      `INSERT INTO tickets (ticket_number, email, discord, subject, priority, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketNumber, email.trim().toLowerCase(), discord.trim(), subject, priority, message.trim()]
    );
    const [[row]] = await conn.query(
      "SELECT * FROM tickets WHERE ticket_number = ?",
      [ticketNumber]
    );
    await conn.commit();
    return toTicket(row);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Find tickets with optional filters and pagination.
 * @returns {Promise<{tickets: object[], total: number, statusCounts: object}>}
 */
export async function find({ status, priority, page = 1, limit = 20 } = {}) {
  const conditions = [];
  const params = [];
  if (status)   { conditions.push("status = ?");   params.push(status); }
  if (priority) { conditions.push("priority = ?"); params.push(priority); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT * FROM tickets ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [statusRows] = await pool.query(
    "SELECT status, COUNT(*) AS count FROM tickets GROUP BY status"
  );
  const statusCounts = Object.fromEntries(statusRows.map((r) => [r.status, r.count]));

  return { tickets: rows.map(toTicket), total, statusCounts };
}

/**
 * Find a single ticket by its numeric id.
 */
export async function findById(id) {
  const [[row]] = await pool.query("SELECT * FROM tickets WHERE id = ?", [id]);
  return toTicket(row ?? null);
}

/**
 * Update status (and optionally adminNotes / resolvedAt) for a ticket.
 */
export async function updateStatus(id, { status, adminNotes }) {
  const sets = ["status = ?"];
  const params = [status];

  if (adminNotes !== undefined) { sets.push("admin_notes = ?"); params.push(adminNotes); }
  if (status === "resolved")    { sets.push("resolved_at = NOW()"); }

  params.push(id);
  const [result] = await pool.query(
    `UPDATE tickets SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
  if (result.affectedRows === 0) return null;
  return findById(id);
}

/**
 * Update the discordMessageId after a ticket has been forwarded to Discord.
 */
export async function setDiscordMessageId(id, msgId) {
  await pool.query("UPDATE tickets SET discord_message_id = ? WHERE id = ?", [msgId, id]);
}

/**
 * Delete a ticket by id.
 * @returns {Promise<boolean>} true if deleted, false if not found.
 */
export async function remove(id) {
  const [result] = await pool.query("DELETE FROM tickets WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
