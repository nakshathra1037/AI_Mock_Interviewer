import mysql from "mysql2/promise";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

/**
 * MySQL Connection Pool
 * Using createPool (via mysql2/promise) ensures that concurrent requests
 * do not block each other by reusing a pool of active database connections.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ai_mock_interviewer",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
