/**
 * Ticket data-access layer — backed by MySQL (tickets_db.tickets).
 */
import pool from "../db/mysql.js";

async function nextTicketNumber(conn) {
  const [rows] = await conn.query(
    "SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1"
  );
  if (!rows.length) return "TK-0001";
  const n = parseInt(rows[0].ticket_number.replace("TK-", ""), 10);
  return `TK-${String((isNaN(n) ? 0 : n) + 1).padStart(4, "0")}`;
}

function toTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    email: row.email,
    discord: row.discord,
    subject: row.subject,
    priority: row.priority,
    budget: row.budget,
    timeline: row.timeline,
    message: row.message,
    status: row.status,
    discordMessageId: row.discord_message_id,
    discordThreadId: row.discord_thread_id,
    discordChannelId: row.discord_channel_id,
    adminNotes: row.admin_notes,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function create({ email, discord = "", subject, priority = "low", budget = "", timeline = "", message }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ticketNumber = await nextTicketNumber(conn);
    await conn.query(
      `INSERT INTO tickets (ticket_number, email, discord, subject, priority, budget, timeline, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticketNumber, email.trim().toLowerCase(), discord.trim(), subject, priority, budget.trim(), timeline.trim(), message.trim()]
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
  const statusCounts = Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)]));

  return { tickets: rows.map(toTicket), total, statusCounts };
}

export async function findById(id) {
  const [[row]] = await pool.query("SELECT * FROM tickets WHERE id = ?", [id]);
  return toTicket(row ?? null);
}

export async function findByIds(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await pool.query(`SELECT * FROM tickets WHERE id IN (${placeholders})`, ids);
  return rows.map(toTicket);
}

export async function updateStatus(id, { status, priority, adminNotes }) {
  const sets = ["status = ?"];
  const params = [status];

  if (priority !== undefined)   { sets.push("priority = ?");    params.push(priority); }
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

export async function setDiscordMessageId(id, msgId) {
  await pool.query("UPDATE tickets SET discord_message_id = ? WHERE id = ?", [msgId, id]);
}

export async function setDiscordChannelId(id, channelId) {
  await pool.query("UPDATE tickets SET discord_channel_id = ? WHERE id = ?", [channelId, id]);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM tickets WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function findByTicketNumber(ticketNumber) {
  const [[row]] = await pool.query("SELECT * FROM tickets WHERE ticket_number = ?", [ticketNumber]);
  return toTicket(row ?? null);
}

export async function findList({ status, priority, limit = 15 } = {}) {
  const conditions = [];
  const params = [];
  if (status)   { conditions.push("status = ?");   params.push(status); }
  if (priority) { conditions.push("priority = ?"); params.push(priority); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM tickets ${where} ORDER BY created_at DESC LIMIT ?`,
    [...params, Number(limit)]
  );
  return rows.map(toTicket);
}

export async function closeByTicketNumber(ticketNumber) {
  const [result] = await pool.query(
    "UPDATE tickets SET status = 'closed' WHERE ticket_number = ?",
    [ticketNumber]
  );
  if (result.affectedRows === 0) return null;
  return findByTicketNumber(ticketNumber);
}

export async function removeMany(ids) {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const [result] = await pool.query(`DELETE FROM tickets WHERE id IN (${placeholders})`, ids);
  return result.affectedRows;
}
