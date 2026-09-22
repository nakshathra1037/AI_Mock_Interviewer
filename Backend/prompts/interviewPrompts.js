/**
 * Server-side prompt templates and difficulty guidance for AI Mock Interviewer.
 * 
 * Keeping prompts isolated in this file ensures they are easy to find,
 * inspect, fine-tune, or extend in future phases.
 */

// Difficulty definitions: server-side guidance describing what each level tests
export const DIFFICULTY_GUIDANCE = {
  Junior:
    "Focus on fundamental concepts, core syntax, basic definitions, foundational best practices, and simple troubleshooting. Keep questions approachable without assuming deep production or architecture experience.",
  Mid:
    "Focus on practical problem-solving, architectural components, performance optimization, edge cases, error handling, and real-world system implementation.",
  Senior:
    "Focus on high-level system architecture, scalability, trade-off reasoning, resilience, failure modes, concurrency, and strategic engineering decisions."
};

/**
 * Builds the prompt for generating the initial or new interview question.
 * 
 * @param {string} role - The target job role (e.g. "Backend Developer")
 * @param {string} difficulty - "Junior" | "Mid" | "Senior"
 * @param {Array} conversationHistory - Full history array [{ role: 'assistant' | 'user', content: string }]
 * @returns {string} The formatted prompt string
 */
export function buildQuestionPrompt(role, difficulty, conversationHistory = []) {
  const guidance = DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.Junior;

  // Format existing history if any (useful if generating a new question mid-interview)
  let historySection = "";
  if (conversationHistory.length > 0) {
    historySection = `
Previous interview context:
${conversationHistory.map((item) => `${item.role === "assistant" ? "Interviewer" : "Candidate"}: ${item.content}`).join("\n")}
`;
  }

  return `You are a professional, experienced technical interviewer conducting a mock interview.

Target Role: ${role}
Difficulty Level: ${difficulty}
Level Guidance: ${guidance}
${historySection}
Your Task:
Generate exactly ONE relevant, realistic, and engaging interview question for this candidate appropriate for the specified role and difficulty level.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "question": "Your interview question here"
}`;
}

/**
 * Builds the prompt for evaluating a candidate's answer and generating a natural follow-up question.
 * 
 * @param {string} role - The target job role (e.g. "Backend Developer")
 * @param {string} difficulty - "Junior" | "Mid" | "Senior"
 * @param {string} question - The question that was asked
 * @param {string} answer - The candidate's typed response
 * @param {Array} conversationHistory - Full history array [{ role: 'assistant' | 'user', content: string }]
 * @returns {string} The formatted prompt string
 */
export function buildEvaluationPrompt(role, difficulty, question, answer, conversationHistory = []) {
  const guidance = DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.Junior;

  // Format full conversation history chronologically for full interview context
  let historySection = "";
  if (conversationHistory.length > 0) {
    historySection = `
Full Interview Conversation History So Far:
${conversationHistory.map((item) => `${item.role === "assistant" ? "Interviewer" : "Candidate"}: ${item.content}`).join("\n\n")}
`;
  }

  return `You are an expert, constructive technical interviewer conducting a mock interview.

Target Role: ${role}
Difficulty Level: ${difficulty}
Level Guidance: ${guidance}
${historySection}

Current Question Asked:
"${question}"

Candidate's Answer:
"${answer}"

Your Task:
1. Provide constructive, balanced feedback on the candidate's answer. Assess:
   - Clarity: Is the explanation clear, articulate, and well-structured?
   - Correctness: Are the technical concepts, terminology, and logic accurate?
   - Completeness: Did the answer address the core question and mention key trade-offs or components?
   Keep the feedback concise, professional, and actionable (2-4 sentences).

2. Generate the next question: A natural follow-up question based directly on what the candidate just said.
   - Do NOT abruptly jump to a random new topic.
   - Dig deeper into a concept they mentioned, ask how they would handle a specific edge case or trade-off related to their answer, or challenge an assumption in a realistic way.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "feedback": "Your evaluation assessing clarity, correctness, and completeness here.",
  "nextQuestion": "Your natural follow-up question here."
}`;
}
