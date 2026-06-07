import mysql from "mysql2/promise";

// Railway injecte MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE automatiquement
// On les lit en priorité, avec fallback sur les variables MYSQL_* manuelles
const DB_HOST     = process.env.MYSQLHOST     || process.env.MYSQL_HOST     || "localhost";
const DB_PORT     = Number(process.env.MYSQLPORT || process.env.MYSQL_PORT) || 3306;
const DB_USER     = process.env.MYSQLUSER     || process.env.MYSQL_USER     || "root";
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "";
const DB_NAME     = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "tickets_db";

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export async function initMySQL() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${DB_NAME}\``);
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
