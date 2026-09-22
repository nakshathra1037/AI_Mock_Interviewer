import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service to interact with the Google Gemini API.
 * Handles API key validation, model initialization, JSON mode, and robust parsing.
 */

// Preferred models in priority order (will try each until one succeeds)
const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-pro"
];

/**
 * Validates if the Gemini API key is configured.
 * @returns {string|null} Cleaned API key, or null if mock fallback is enabled
 * @throws {Error} If key is missing and mock fallback is not enabled
 */
function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const isKeyConfigured = apiKey && apiKey !== "your_gemini_api_key_here";

  if (!isKeyConfigured) {
    // If mock fallback is enabled, allow demo responses without throwing
    if (process.env.ENABLE_MOCK_FALLBACK === "true") {
      return null;
    }
    throw new Error(
      "Gemini API key is not configured. Please set your GEMINI_API_KEY in backend/.env file (get a free key at https://aistudio.google.com/app/apikey) or set ENABLE_MOCK_FALLBACK=true for local simulation."
    );
  }
  return apiKey;
}

/**
 * Extracts and safely parses JSON from raw LLM output text.
 * Strips code blocks, trims whitespace, and uses regex fallback if necessary.
 * 
 * @param {string} rawText 
 * @returns {object} Parsed JSON object
 */
export function safelyParseJSON(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response received from LLM.");
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g., ```json ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Attempt direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Attempt regex extraction of the first {...} block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (regexErr) {
        // Fall through to error throwing below
      }
    }

    // Spec requirement: Catch parse error and return clear error message instead of crashing
    throw new Error(
      `Failed to parse LLM response as JSON. Raw output was: "${rawText.slice(0, 150)}..."`
    );
  }
}

/**
 * Calls Gemini to generate content with JSON response mode.
 * 
 * @param {string} prompt - The prompt text
 * @returns {Promise<object>} The parsed JSON object returned by the model
 */
export async function callGeminiJSON(prompt) {
  const apiKey = getApiKey();

  // If no API key is configured but ENABLE_MOCK_FALLBACK is true, generate simulated responses
  if (!apiKey) {
    // Check if this is an evaluation or question generation prompt
    if (prompt.includes("Your Task:\n1. Provide constructive, balanced feedback")) {
      return {
        feedback: "Good clarity and solid explanation! Your answer covered the essential concepts clearly. To improve further, consider mentioning potential trade-offs and performance implications.",
        nextQuestion: "That makes sense. Can you explain how you would handle potential failure modes or edge cases in that implementation?"
      };
    } else {
      return {
        question: "Could you walk me through your technical approach to building and structuring scalable APIs, and how you handle error logging and validation?"
      };
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError = null;
  const MAX_RETRIES = 3;

  for (const modelName of MODEL_CANDIDATES) {
    // Retry loop for transient 503 errors on the same model
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        return safelyParseJSON(rawText);
      } catch (err) {
        lastError = err;

        // If model not found (404), skip to next model candidate
        if (err.status === 404 || err.message?.includes("not found")) {
          console.warn(`Model ${modelName} not available, attempting fallback...`);
          break; // break retry loop, continue to next model
        }

        // If 503 / overloaded, retry with backoff
        if (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand")) {
          const delay = 1000 * attempt; // 1s, 2s, 3s
          console.warn(`Model ${modelName} overloaded (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // For auth, quota, parse, or other errors, rethrow immediately
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API.");
}
