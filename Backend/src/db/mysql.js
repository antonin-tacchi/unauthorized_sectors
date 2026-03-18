import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "tickets_user",
  password: process.env.MYSQL_PASSWORD || "tickets_pass",
  database: process.env.MYSQL_DATABASE || "tickets_db",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export default pool;
