import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the MySQL database and executes schema.sql if tables do not exist.
 * Catches connection errors gracefully so that the backend server does not crash
 * if the database is temporarily unreachable or misconfigured.
 */
export async function initDB() {
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "ai_mock_interviewer";

  let tempConnection = null;
  try {
    // 1. Connect to MySQL server without selecting a database first
    tempConnection = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true
    });

    // 2. Ensure database exists
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await tempConnection.query(`USE \`${database}\`;`);

    // 3. Read and execute schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Execute schema statements
    await tempConnection.query(schemaSql);

    console.log(`✅ MySQL database '${database}' and tables initialized successfully.`);
  } catch (err) {
    console.error("❌ MySQL initialization warning / error:", err.message);
    console.warn("⚠️ Ensure MySQL is running and DB_USER/DB_PASSWORD in backend/.env are configured properly.");
    console.warn("⚠️ The server will continue running, but database features will require a working database connection.");
  } finally {
    if (tempConnection) {
      try {
        await tempConnection.end();
      } catch (closeErr) {
        // ignore closing error
      }
    }
  }
}

export default initDB;
