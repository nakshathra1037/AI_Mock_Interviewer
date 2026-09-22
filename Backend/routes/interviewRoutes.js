import express from "express";
import {
  DIFFICULTY_GUIDANCE,
  buildQuestionPrompt,
  buildEvaluationPrompt
} from "../prompts/interviewPrompts.js";
import { callGeminiJSON } from "../services/geminiService.js";

const router = express.Router();

/**
 * POST /api/generate-question
 * Request Body: { role: string, difficulty: string, conversationHistory?: Array }
 * Response: { question: string }
 */
router.post("/generate-question", async (req, res) => {
  try {
    const { role, difficulty, conversationHistory = [] } = req.body;

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

    return res.json({ question: result.question.trim() });
  } catch (err) {
    console.error("Error in /api/generate-question:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to generate interview question. Please try again."
    });
  }
});

/**
 * POST /api/evaluate-answer
 * Request Body: { question: string, answer: string, conversationHistory?: Array, role?: string, difficulty?: string }
 * Response: { feedback: string, nextQuestion: string }
 */
router.post("/evaluate-answer", async (req, res) => {
  try {
    const {
      question,
      answer,
      conversationHistory = [],
      role = "Candidate",
      difficulty = "Junior"
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

export default router;
