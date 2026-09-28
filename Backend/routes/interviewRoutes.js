import express from "express";
import {
  DIFFICULTY_GUIDANCE,
  buildQuestionPrompt,
  buildEvaluationPrompt,
  buildResumeTailoredQuestionPrompt,
  buildSessionSummaryPrompt
} from "../prompts/interviewPrompts.js";
import { callGeminiJSON } from "../services/geminiService.js";
import pool from "../db/connection.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to protect all interview and session routes
router.use(authenticateToken);

/**
 * POST /api/generate-question
 * Request Body: { role: string, difficulty: string, conversationHistory?: Array, sessionId?: number, useResume?: boolean }
 * Response: { question: string, questionType: string, sessionId?: number }
 */
router.post("/generate-question", async (req, res) => {
  try {
    const {
      role,
      difficulty,
      conversationHistory = [],
      sessionId: existingSessionId,
      useResume = false
    } = req.body;

    // Validate incoming parameters
    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'role' in request body." });
    }

    const validLevels = ["Junior", "Mid", "Senior"];
    const normalizedDifficulty = validLevels.find(
      (lvl) => lvl.toLowerCase() === (difficulty || "").toLowerCase()
    ) || "Junior";

    let prompt;

    // Check if user requested resume-tailored question generation
    if (useResume) {
      try {
        const [resumeRows] = await pool.query(
          "SELECT resume_text FROM resumes WHERE user_id = ? LIMIT 1",
          [req.userId]
        );

        if (resumeRows && resumeRows.length > 0 && resumeRows[0].resume_text) {
          prompt = buildResumeTailoredQuestionPrompt(
            role.trim(),
            normalizedDifficulty,
            resumeRows[0].resume_text,
            conversationHistory
          );
        } else {
          // Fallback if no resume uploaded
          prompt = buildQuestionPrompt(role.trim(), normalizedDifficulty, conversationHistory);
        }
      } catch (dbErr) {
        console.warn("Could not query resume, falling back to standard prompt:", dbErr.message);
        prompt = buildQuestionPrompt(role.trim(), normalizedDifficulty, conversationHistory);
      }
    } else {
      // Build standard question prompt with server-side difficulty guidance
      prompt = buildQuestionPrompt(role.trim(), normalizedDifficulty, conversationHistory);
    }

    // Call Gemini API and receive parsed JSON
    const result = await callGeminiJSON(prompt);

    if (!result || !result.question) {
      throw new Error("LLM response did not contain a 'question' field.");
    }

    const questionType =
      result.questionType && ["technical", "behavioral"].includes(result.questionType.toLowerCase())
        ? result.questionType.toLowerCase()
        : "technical";

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
      questionType,
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
 * Request Body: { question: string, answer: string, conversationHistory?: Array, role?: string, difficulty?: string, sessionId?: number, questionType?: string }
 * Response: { feedback: object, nextQuestion: string }
 */
router.post("/evaluate-answer", async (req, res) => {
  try {
    const {
      question,
      answer,
      conversationHistory = [],
      role = "Candidate",
      difficulty = "Junior",
      sessionId,
      questionType = "technical"
    } = req.body;

    // Validate required fields
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'question' in request body." });
    }

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'answer' in request body." });
    }

    const normalizedQuestionType =
      questionType && ["technical", "behavioral"].includes(questionType.toLowerCase())
        ? questionType.toLowerCase()
        : "technical";

    // Build evaluation prompt using conversation history & questionType
    const prompt = buildEvaluationPrompt(
      role,
      difficulty,
      question.trim(),
      answer.trim(),
      conversationHistory,
      normalizedQuestionType
    );

    // Call Gemini API and receive parsed JSON
    const result = await callGeminiJSON(prompt);

    if (!result || !result.feedback || !result.nextQuestion) {
      throw new Error(
        "LLM response did not contain expected 'feedback' and 'nextQuestion' fields."
      );
    }

    // Process and normalize structured feedback
    let feedbackObject = result.feedback;
    if (typeof feedbackObject === "string") {
      // Fallback if LLM returned plain text instead of object
      feedbackObject = {
        clarity: { score: 3, comment: feedbackObject },
        technicalAccuracy: { score: 3, comment: feedbackObject },
        structure: { score: 3, comment: feedbackObject },
        specificity: { score: 3, comment: feedbackObject }
      };
    }

    // Defensive starAnalysis validation & fallback to null on error
    let starAnalysis = result.starAnalysis || null;
    if (normalizedQuestionType === "behavioral" && starAnalysis) {
      try {
        starAnalysis = {
          situation: Boolean(starAnalysis.situation),
          task: Boolean(starAnalysis.task),
          action: Boolean(starAnalysis.action),
          result: Boolean(starAnalysis.result),
          missingParts: Array.isArray(starAnalysis.missingParts)
            ? starAnalysis.missingParts
            : []
        };
      } catch (e) {
        console.warn("Failed to parse starAnalysis for behavioral question, falling back to null:", e.message);
        starAnalysis = null;
      }
    } else {
      starAnalysis = null;
    }

    const weakestCategory = result.weakestCategory || "technicalAccuracy";

    const structuredFeedback = {
      feedback: feedbackObject,
      weakestCategory,
      starAnalysis
    };

    // Store structured feedback as JSON text in the existing turns.feedback column
    const feedbackTextToStore = JSON.stringify(structuredFeedback);

    // Persist turn in `turns` table if sessionId is provided
    if (sessionId) {
      try {
        await pool.query(
          "INSERT INTO turns (session_id, question, answer, feedback, questionType) VALUES (?, ?, ?, ?, ?)",
          [sessionId, question.trim(), answer.trim(), feedbackTextToStore, normalizedQuestionType]
        );
      } catch (dbErr) {
        console.error("Database error saving turn:", dbErr.message);
        // Do not crash the response if saving turn encounters a db error
      }
    }

    return res.json({
      feedback: structuredFeedback,
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
 * POST /api/session-summary
 * Request Body: { sessionId: number }
 * Response: { overallStrengths: string[], overallWeaknesses: string[], studyPlan: string[] }
 */
router.post("/session-summary", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing required 'sessionId' in request body." });
    }

    // Verify session belongs to req.userId
    const [sessionRows] = await pool.query(
      "SELECT id, user_id FROM sessions WHERE id = ? AND user_id = ?",
      [sessionId, req.userId]
    );

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(404).json({ error: "Session not found or unauthorized access." });
    }

    // Lookup all turns for that session from database
    const [turns] = await pool.query(
      "SELECT question, answer, feedback FROM turns WHERE session_id = ? ORDER BY created_at ASC, id ASC",
      [sessionId]
    );

    // Defensive error handling: zero turns -> clear 400
    if (!turns || turns.length === 0) {
      return res.status(400).json({
        error: "Cannot generate session summary: No answered questions recorded for this session."
      });
    }

    const prompt = buildSessionSummaryPrompt(turns);
    const result = await callGeminiJSON(prompt);

    if (!result) {
      throw new Error("Failed to receive session summary from LLM.");
    }

    const overallStrengths = Array.isArray(result.overallStrengths)
      ? result.overallStrengths
      : ["Clear participation throughout interview"];
    const overallWeaknesses = Array.isArray(result.overallWeaknesses)
      ? result.overallWeaknesses
      : ["Consider adding more concrete examples"];
    const studyPlan = Array.isArray(result.studyPlan)
      ? result.studyPlan
      : ["Review role core concepts and STAR behavioral framework"];

    return res.json({
      overallStrengths,
      overallWeaknesses,
      studyPlan
    });
  } catch (err) {
    console.error("Error in /api/session-summary:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to generate session summary."
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
