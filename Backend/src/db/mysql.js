import mysql from "mysql2/promise";

function getConfig() {
  const url = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
  if (url) {
    const u = new URL(url);
    const requireSsl = u.searchParams.get("ssl-mode") === "REQUIRED" || u.hostname.includes("aivencloud");
    return {
      host:     u.hostname,
      port:     Number(u.port) || 3306,
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.slice(1).split("?")[0],
      ...(requireSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }
  return {
    host:     process.env.MYSQLHOST     || process.env.MYSQL_HOST     || "localhost",
    port:     Number(process.env.MYSQLPORT || process.env.MYSQL_PORT) || 3306,
    user:     process.env.MYSQLUSER     || process.env.MYSQL_USER     || "root",
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "tickets_db",
  };
}

const cfg = getConfig();

const pool = mysql.createPool({
  ...cfg,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export async function initMySQL() {
  const { database, ...connCfg } = cfg;
  const conn = await mysql.createConnection({ ...connCfg, database: undefined });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${cfg.database}\``);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(10) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        discord VARCHAR(100) NOT NULL DEFAULT '',
        subject ENUM('Custom MLO','Exterior Mapping','Optimization','Bug Report','Complaint','General Question','Other','Existing Project') NOT NULL,
        priority ENUM('low','medium','high') NOT NULL DEFAULT 'low',
        budget VARCHAR(100) NOT NULL DEFAULT '',
        timeline VARCHAR(100) NOT NULL DEFAULT '',
        project_ref VARCHAR(255) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        status ENUM('open','in-progress','resolved','closed') NOT NULL DEFAULT 'open',
        discord_message_id VARCHAR(30) NOT NULL DEFAULT '',
        discord_thread_id VARCHAR(30) NOT NULL DEFAULT '',
        discord_channel_id VARCHAR(30) NOT NULL DEFAULT '',
        admin_notes TEXT,
        resolved_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Idempotent migrations — ignore ER_DUP_FIELDNAME (column already exists)
    const alterations = [
      "ALTER TABLE tickets ADD COLUMN budget VARCHAR(100) NOT NULL DEFAULT ''",
      "ALTER TABLE tickets ADD COLUMN timeline VARCHAR(100) NOT NULL DEFAULT ''",
      "ALTER TABLE tickets ADD COLUMN project_ref VARCHAR(255) NOT NULL DEFAULT ''",
      "ALTER TABLE tickets ADD COLUMN discord_thread_id VARCHAR(30) NOT NULL DEFAULT ''",
      "ALTER TABLE tickets ADD COLUMN discord_channel_id VARCHAR(30) NOT NULL DEFAULT ''",
      "ALTER TABLE tickets MODIFY COLUMN subject ENUM('Custom MLO','Exterior Mapping','Optimization','Bug Report','Complaint','General Question','Other','Existing Project') NOT NULL",
    ];
    for (const sql of alterations) {
      await conn.query(sql).catch((e) => {
        if (e.code !== "ER_DUP_FIELDNAME") console.warn("Migration warning:", e.message);
      });
    }
    console.log("✅ MySQL initialized");
  } finally {
    await conn.end();
  }
}

export default pool;
