import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/connection.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "ai_mock_interviewer_phase2_secret_key_jwt_2026";
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/signup
 * Request Body: { name, email, password }
 * Response: { token: string, user: { id, name, email } }
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim() ||
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !password ||
      typeof password !== "string" ||
      !password.trim()
    ) {
      return res.status(400).json({
        error: "Missing required fields: 'name', 'email', and 'password' are all required."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Hash the password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      // Insert user record into database
      const [insertResult] = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [cleanName, cleanEmail, passwordHash]
      );

      const userId = insertResult.insertId;

      // Generate JWT
      const token = jwt.sign(
        { userId, name: cleanName, email: cleanEmail },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return token and sanitized user details (NEVER return password or password_hash)
      return res.status(201).json({
        message: "Account created successfully.",
        token,
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail
        }
      });
    } catch (dbErr) {
      // Catch MySQL duplicate key error (ER_DUP_ENTRY / 1062)
      if (dbErr.code === "ER_DUP_ENTRY" || dbErr.errno === 1062) {
        return res.status(409).json({
          error: "An account with this email address already exists. Please log in."
        });
      }
      throw dbErr;
    }
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({
      error: "Failed to create account due to a database or server error. Please try again."
    });
  }
});

/**
 * POST /api/auth/login
 * Request Body: { email, password }
 * Response: { token: string, user: { id, name, email } }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate incoming credentials
    if (
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !password ||
      typeof password !== "string" ||
      !password.trim()
    ) {
      // Never reveal specifically what is missing or incorrect to avoid enumeration
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      // User not found - return generic message
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = rows[0];

    // Verify password with bcrypt.compare
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      // Password does not match - return generic message
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token and sanitized user details
    return res.json({
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({
      error: "Authentication service error. Please try again."
    });
  }
});

export default router;
