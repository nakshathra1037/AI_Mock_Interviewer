import express from "express";
import multer from "multer";
import path from "path";
import mammoth from "mammoth";
import pool from "../db/connection.js";
import authenticateToken from "../middleware/auth.js";
import {
  buildResumeFitAnalysisPrompt,
  buildRoleSuggestionsPrompt
} from "../prompts/interviewPrompts.js";
import { callGeminiJSON } from "../services/geminiService.js";

const router = express.Router();

// Apply auth middleware to protect all resume endpoints
router.use(authenticateToken);

// Configure multer for memory storage with a 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf" || ext === ".docx") {
      cb(null, true);
    } else {
      const err = new Error("Invalid file type. Only .pdf and .docx files are accepted.");
      err.status = 400;
      cb(err, false);
    }
  }
}).single("resume");

/**
 * Helper to extract plain text from an uploaded PDF or DOCX buffer.
 * Rejects with a clear error if text cannot be parsed or is empty.
 */
async function extractTextFromBuffer(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const textResult = await parser.getText();
      const text = textResult?.text ? textResult.text.trim() : "";
      if (!text) {
        throw new Error(
          "No readable text found in PDF. Scanned or image-only PDFs are not supported."
        );
      }
      return text;
    } catch (err) {
      throw new Error(
        err.message.includes("Scanned")
          ? err.message
          : `Failed to extract text from PDF: ${err.message}`
      );
    }
  } else if (ext === ".docx") {
    try {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      const text = value ? value.trim() : "";
      if (!text) {
        throw new Error("No readable text found in DOCX file. Document may be empty.");
      }
      return text;
    } catch (err) {
      throw new Error(
        err.message.includes("No readable text")
          ? err.message
          : `Failed to extract text from DOCX: ${err.message}`
      );
    }
  }

  throw new Error("Unsupported file format. Please upload a .pdf or .docx document.");
}

/**
 * POST /api/resume/upload
 * Accepts a single file via multer (field name: "resume").
 * Extracts plain text from PDF or DOCX and saves to MySQL resumes table.
 */
router.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File exceeds the 5MB size limit." });
      }
      return res.status(err.status || 400).json({ error: err.message || "File upload failed." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded. Please select a file." });
    }

    try {
      // Extract text content from file buffer
      const resumeText = await extractTextFromBuffer(req.file);

      // Save/Replace in MySQL database (UNIQUE constraint on user_id)
      await pool.query(
        `INSERT INTO resumes (user_id, resume_text, file_name)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           resume_text = VALUES(resume_text),
           file_name = VALUES(file_name),
           uploaded_at = CURRENT_TIMESTAMP`,
        [req.userId, resumeText, req.file.originalname]
      );

      return res.json({
        message: "Resume uploaded",
        fileName: req.file.originalname
      });
    } catch (parseErr) {
      console.error("Resume parsing error:", parseErr.message);
      return res.status(400).json({
        error: parseErr.message || "Failed to process the uploaded resume."
      });
    }
  });
});

/**
 * GET /api/resume
 * Returns the currently logged-in user's stored resume info,
 * or 404 if no resume has been uploaded yet.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT file_name, resume_text, uploaded_at FROM resumes WHERE user_id = ? LIMIT 1",
      [req.userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        hasResume: false,
        message: "No resume uploaded yet.",
        fileName: null,
        resumeText: null
      });
    }

    const resume = rows[0];
    return res.json({
      hasResume: true,
      fileName: resume.file_name,
      resumeText: resume.resume_text,
      uploadedAt: resume.uploaded_at
    });
  } catch (err) {
    console.error("Error fetching resume:", err.message);
    return res.status(500).json({
      error: "Failed to retrieve stored resume. Please try again."
    });
  }
});

/**
 * POST /api/resume/fit-analysis
 * Analyzes candidate's stored resume against a provided job description.
 * Request Body: { jobDescription: string }
 * Response: { fitScore, matchingSkills, missingSkills, suggestions }
 */
router.post("/fit-analysis", async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({
        error: "Missing or invalid 'jobDescription' in request body."
      });
    }

    // Look up user's stored resume
    const [rows] = await pool.query(
      "SELECT resume_text FROM resumes WHERE user_id = ? LIMIT 1",
      [req.userId]
    );

    if (!rows || rows.length === 0 || !rows[0].resume_text) {
      return res.status(400).json({
        error: "No resume found. Please upload your resume first before running a fit analysis."
      });
    }

    const resumeText = rows[0].resume_text;

    // Build fit analysis prompt and call Gemini
    const prompt = buildResumeFitAnalysisPrompt(resumeText, jobDescription.trim());
    const result = await callGeminiJSON(prompt);

    if (!result || !result.fitScore) {
      throw new Error("AI response did not contain expected fit analysis structure.");
    }

    return res.json({
      fitScore: result.fitScore || "N/A",
      matchingSkills: Array.isArray(result.matchingSkills) ? result.matchingSkills : [],
      missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
      suggestions: result.suggestions || "No specific suggestions provided."
    });
  } catch (err) {
    console.error("Error in /api/resume/fit-analysis:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to analyze resume fit. Please try again."
    });
  }
});

/**
 * POST /api/resume/role-suggestions
 * Recommends 2-3 suitable roles based on the candidate's uploaded resume alone.
 * Response: { recommendations: [ { role, reasoning } ] }
 */
router.post("/role-suggestions", async (req, res) => {
  try {
    // Look up user's stored resume
    const [rows] = await pool.query(
      "SELECT resume_text FROM resumes WHERE user_id = ? LIMIT 1",
      [req.userId]
    );

    if (!rows || rows.length === 0 || !rows[0].resume_text) {
      return res.status(400).json({
        error: "No resume found. Please upload your resume first to get role recommendations."
      });
    }

    const resumeText = rows[0].resume_text;

    // Build role suggestions prompt and call Gemini
    const prompt = buildRoleSuggestionsPrompt(resumeText);
    const result = await callGeminiJSON(prompt);

    if (!result || !Array.isArray(result.recommendations)) {
      throw new Error("AI response did not contain expected role recommendations array.");
    }

    return res.json({
      recommendations: result.recommendations
    });
  } catch (err) {
    console.error("Error in /api/resume/role-suggestions:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to generate role suggestions. Please try again."
    });
  }
});

export default router;
