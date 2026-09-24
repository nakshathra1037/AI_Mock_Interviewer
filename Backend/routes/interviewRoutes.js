import express from "express";
import {
  DIFFICULTY_GUIDANCE,
  buildQuestionPrompt,
  buildEvaluationPrompt
} from "../prompts/interviewPrompts.js";
import { callGeminiJSON } from "../services/geminiService.js";
import pool from "../db/connection.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to protect all interview and session routes
router.use(authenticateToken);

/**
 * POST /api/generate-question
 * Request Body: { role: string, difficulty: string, conversationHistory?: Array, sessionId?: number }
 * Response: { question: string, sessionId?: number }
 */
router.post("/generate-question", async (req, res) => {
  try {
    const { role, difficulty, conversationHistory = [], sessionId: existingSessionId } = req.body;

    // Validate incoming parameters
    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'role' in request body." });
    }

    const validLevels = ["Junior", "Mid", "Senior"];
    const normalizedDifficulty = validLevels.find(
      (lvl) => lvl.toLowerCase() === (difficulty || "").toLowerCase()
    ) || "Junior";

    // Build question prompt with server-side difficulty guidance
    const prompt = buildQuestionPrompt(role.trim(), normalizedDifficulty, conversationHistory);

    // Call Gemini API and receive parsed JSON
    const result = await callGeminiJSON(prompt);

    if (!result || !result.question) {
      throw new Error("LLM response did not contain a 'question' field.");
    }

    let activeSessionId = existingSessionId || null;

    // If starting a new session (empty conversation history), persist a new row in `sessions`
    if (!conversationHistory || conversationHistory.length === 0) {
      try {
        const [sessionResult] = await pool.query(
          "INSERT INTO sessions (user_id, role, difficulty) VALUES (?, ?, ?)",
          [req.userId, role.trim(), normalizedDifficulty]
        );
        activeSessionId = sessionResult.insertId;
      } catch (dbErr) {
        console.error("Database error creating session:", dbErr.message);
        // Continue and return question, but log db error
      }
    }

    return res.json({
      question: result.question.trim(),
      sessionId: activeSessionId
    });
  } catch (err) {
    console.error("Error in /api/generate-question:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to generate interview question. Please try again."
    });
  }
});

/**
 * POST /api/evaluate-answer
 * Request Body: { question: string, answer: string, conversationHistory?: Array, role?: string, difficulty?: string, sessionId?: number }
 * Response: { feedback: string, nextQuestion: string }
 */
router.post("/evaluate-answer", async (req, res) => {
  try {
    const {
      question,
      answer,
      conversationHistory = [],
      role = "Candidate",
      difficulty = "Junior",
      sessionId
    } = req.body;

    // Validate required fields
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'question' in request body." });
    }

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'answer' in request body." });
    }

    // Build evaluation prompt using conversation history for full context
    const prompt = buildEvaluationPrompt(
      role,
      difficulty,
      question.trim(),
      answer.trim(),
      conversationHistory
    );

    // Call Gemini API and receive parsed JSON
    const result = await callGeminiJSON(prompt);

    if (!result || !result.feedback || !result.nextQuestion) {
      throw new Error(
        "LLM response did not contain expected 'feedback' and 'nextQuestion' fields."
      );
    }

    // Persist turn in `turns` table if sessionId is provided
    if (sessionId) {
      try {
        await pool.query(
          "INSERT INTO turns (session_id, question, answer, feedback) VALUES (?, ?, ?, ?)",
          [sessionId, question.trim(), answer.trim(), result.feedback.trim()]
        );
      } catch (dbErr) {
        console.error("Database error saving turn:", dbErr.message);
        // Do not crash the response if saving turn encounters a db error
      }
    }

    return res.json({
      feedback: result.feedback.trim(),
      nextQuestion: result.nextQuestion.trim()
    });
  } catch (err) {
    console.error("Error in /api/evaluate-answer:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to evaluate answer. Please try again."
    });
  }
});

/**
 * GET /api/sessions
 * Returns all sessions belonging to the authenticated user (req.userId),
 * ordered newest first, with nested turns.
 */
router.get("/sessions", async (req, res) => {
  try {
    const [sessions] = await pool.query(
      "SELECT id, user_id, role, difficulty, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [req.userId]
    );

    if (!sessions || sessions.length === 0) {
      return res.json([]);
    }

    const sessionIds = sessions.map((s) => s.id);
    const [turns] = await pool.query(
      "SELECT id, session_id, question, answer, feedback, created_at FROM turns WHERE session_id IN (?) ORDER BY created_at ASC, id ASC",
      [sessionIds]
    );

    // Group turns by session_id in JS
    const turnsBySessionId = {};
    for (const turn of turns) {
      if (!turnsBySessionId[turn.session_id]) {
        turnsBySessionId[turn.session_id] = [];
      }
      turnsBySessionId[turn.session_id].push(turn);
    }

    const sessionsWithTurns = sessions.map((session) => ({
      ...session,
      turns: turnsBySessionId[session.id] || []
    }));

    return res.json(sessionsWithTurns);
  } catch (err) {
    console.error("Error in GET /api/sessions:", err.message);
    return res.status(500).json({
      error: "Failed to retrieve user sessions from database."
    });
  }
});

/**
 * GET /api/sessions/team
 * Returns sessions from ALL users (joined with users table to include candidate's name),
 * ordered newest first, with nested turns.
 */
router.get("/sessions/team", async (req, res) => {
  try {
    const [sessions] = await pool.query(
      "SELECT s.id, s.user_id, u.name AS user_name, u.email AS user_email, s.role, s.difficulty, s.created_at FROM sessions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC, s.id DESC"
    );

    if (!sessions || sessions.length === 0) {
      return res.json([]);
    }

    const sessionIds = sessions.map((s) => s.id);
    const [turns] = await pool.query(
      "SELECT id, session_id, question, answer, feedback, created_at FROM turns WHERE session_id IN (?) ORDER BY created_at ASC, id ASC",
      [sessionIds]
    );

    // Group turns by session_id in JS
    const turnsBySessionId = {};
    for (const turn of turns) {
      if (!turnsBySessionId[turn.session_id]) {
        turnsBySessionId[turn.session_id] = [];
      }
      turnsBySessionId[turn.session_id].push(turn);
    }

    const sessionsWithTurns = sessions.map((session) => ({
      ...session,
      turns: turnsBySessionId[session.id] || []
    }));

    return res.json(sessionsWithTurns);
  } catch (err) {
    console.error("Error in GET /api/sessions/team:", err.message);
    return res.status(500).json({
      error: "Failed to retrieve team sessions from database."
    });
  }
});

export default router;
