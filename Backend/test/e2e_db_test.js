import pool from "../db/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function testLiveDB() {
  console.log("🚀 Testing live MySQL database operations...\n");

  try {
    // 1. Clean test data if previously existing
    await pool.query("DELETE FROM turns WHERE session_id IN (SELECT id FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'test_candidate@example.com'))");
    await pool.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'test_candidate@example.com')");
    await pool.query("DELETE FROM users WHERE email = 'test_candidate@example.com'");

    // 2. Insert User
    const hash = await bcrypt.hash("Password123!", 10);
    const [userRes] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      ["Test Candidate", "test_candidate@example.com", hash]
    );
    const userId = userRes.insertId;
    console.log(`✅ User inserted successfully with ID: ${userId}`);

    // 3. Insert Session
    const [sessionRes] = await pool.query(
      "INSERT INTO sessions (user_id, role, difficulty) VALUES (?, ?, ?)",
      [userId, "Backend Developer", "Junior"]
    );
    const sessionId = sessionRes.insertId;
    console.log(`✅ Session inserted successfully with ID: ${sessionId}`);

    // 4. Insert Turn
    const [turnRes] = await pool.query(
      "INSERT INTO turns (session_id, question, answer, feedback) VALUES (?, ?, ?, ?)",
      [
        sessionId,
        "What is the event loop in Node.js?",
        "It handles asynchronous callbacks on a single thread.",
        "Clear and concise explanation of single-threaded async processing."
      ]
    );
    console.log(`✅ Turn inserted successfully with ID: ${turnRes.insertId}`);

    // 5. Test Query Sessions (User History)
    const [sessions] = await pool.query(
      "SELECT id, user_id, role, difficulty, created_at FROM sessions WHERE user_id = ?",
      [userId]
    );
    console.log(`✅ Retrieved ${sessions.length} session(s) for user.`);

    // 6. Test Query Team Sessions (JOIN with user name)
    const [teamSessions] = await pool.query(
      "SELECT s.id, s.user_id, u.name AS user_name, u.email AS user_email, s.role, s.difficulty, s.created_at FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
      [sessionId]
    );
    console.log(`✅ Retrieved team session: ${teamSessions[0].user_name} (${teamSessions[0].role})`);

    console.log("\n🎉 ALL LIVE DATABASE OPERATIONS SUCCEEDED 100%!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Live DB test failed:", err);
    process.exit(1);
  }
}

testLiveDB();
