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
}
`;
}

/**
 * Builds the prompt for generating an interview question tailored to the candidate's actual resume.
 * 
 * @param {string} role - The target job role (e.g. "Backend Developer")
 * @param {string} difficulty - "Junior" | "Mid" | "Senior"
 * @param {string} resumeText - Extracted text content of candidate's resume
 * @param {Array} conversationHistory - Full history array [{ role: 'assistant' | 'user', content: string }]
 * @returns {string} The formatted prompt string
 */
export function buildResumeTailoredQuestionPrompt(
  role,
  difficulty,
  resumeText,
  conversationHistory = []
) {
  const guidance = DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.Junior;

  // Include conversation history if continuing an interview
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

Candidate's Resume Profile:
"""
${resumeText.slice(0, 8000)}
"""
${historySection}
Your Task:
Generate exactly ONE relevant, realistic, and engaging interview question for this candidate.
CRITICAL REQUIREMENT: Directly reference or probe a specific project, technology stack, achievement, or engineering responsibility explicitly listed in the candidate's resume, connecting it to the target role and difficulty level.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "question": "Your tailored interview question referencing their resume here"
}`;
}

/**
 * Builds the prompt for analyzing how well a resume fits a specific job description.
 * 
 * @param {string} resumeText - Candidate's parsed resume text
 * @param {string} jobDescription - Target job posting / requirements text
 * @returns {string} The formatted prompt string
 */
export function buildResumeFitAnalysisPrompt(resumeText, jobDescription) {
  return `You are an expert technical recruiter and hiring manager.

Analyze how well the candidate's resume matches the target job description.

Candidate's Resume:
"""
${resumeText.slice(0, 8000)}
"""

Target Job Description:
"""
${jobDescription.slice(0, 8000)}
"""

Your Task:
1. Calculate a realistic fit score percentage (e.g., "85%" or "72%").
2. Extract key matching skills and technologies evidenced in both the resume and the job requirements.
3. Identify missing or underdeveloped skills required or preferred by the job description.
4. Provide actionable, constructive suggestions for the candidate to improve their fit, highlight transferable skills, or address gaps.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "fitScore": "85%",
  "matchingSkills": ["Skill 1", "Skill 2", "Skill 3"],
  "missingSkills": ["Skill 4", "Skill 5"],
  "suggestions": "Actionable recommendations on how candidate can improve alignment."
}`;
}

/**
 * Builds the prompt for recommending suitable roles based on resume skills and projects alone.
 * 
 * @param {string} resumeText - Candidate's parsed resume text
 * @returns {string} The formatted prompt string
 */
export function buildRoleSuggestionsPrompt(resumeText) {
  return `You are an expert career advisor and technical recruiter.

Analyze the candidate's resume and recommend 2 to 3 job roles they are exceptionally well-suited for.

Candidate's Resume:
"""
${resumeText.slice(0, 8000)}
"""

Your Task:
Recommend 2 to 3 realistic job roles that directly match the candidate's demonstrated technologies, project experience, and strengths. For each role, provide clear, concise reasoning explaining why they are a strong fit.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "recommendations": [
    {
      "role": "Role Title",
      "reasoning": "Clear 1-2 sentence explanation of why this candidate's background matches this role."
    }
  ]
}`;
}

