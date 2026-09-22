import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import interviewRoutes from "./routes/interviewRoutes.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (and local requests)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
    )
  });
});

// Interview API routes
app.use("/api", interviewRoutes);

// 404 Catch-all handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not set in backend/.env!");
  } else {
    console.log("Gemini API key is configured.");
  }
});
