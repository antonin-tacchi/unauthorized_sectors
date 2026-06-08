import mysql from "mysql2/promise";

// Support MYSQL_URL (ex: mysql://user:pass@host:3306/db) ou variables séparées
function getConfig() {
  const url = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
  if (url) {
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     Number(u.port) || 3306,
      user:     u.username,
      password: u.password,
      database: u.pathname.slice(1),
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
        subject ENUM('Custom MLO','Exterior Mapping','Optimization','Bug Report','Other') NOT NULL,
        priority ENUM('low','medium','high') NOT NULL DEFAULT 'low',
        message TEXT NOT NULL,
        status ENUM('open','in-progress','resolved','closed') NOT NULL DEFAULT 'open',
        discord_message_id VARCHAR(30) NOT NULL DEFAULT '',
        admin_notes TEXT NOT NULL DEFAULT '',
        resolved_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ MySQL initialized");
  } finally {
    await conn.end();
  }
}

export default pool;
