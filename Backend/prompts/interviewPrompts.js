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
Classify the question as either "technical" (testing programming, system design, data structures, framework concepts, language mechanics) or "behavioral" (testing teamwork, past experience, handling challenges, leadership, communication).

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "question": "Your interview question here",
  "questionType": "technical"
}`;
}

/**
 * Builds the prompt for evaluating a candidate's answer with structured category feedback,
 * STAR framework analysis (for behavioral questions), and targeted follow-up question.
 * 
 * @param {string} role - The target job role (e.g. "Backend Developer")
 * @param {string} difficulty - "Junior" | "Mid" | "Senior"
 * @param {string} question - The question that was asked
 * @param {string} answer - The candidate's typed response
 * @param {Array} conversationHistory - Full history array [{ role: 'assistant' | 'user', content: string }]
 * @param {string} questionType - "technical" | "behavioral"
 * @returns {string} The formatted prompt string
 */
export function buildEvaluationPrompt(
  role,
  difficulty,
  question,
  answer,
  conversationHistory = [],
  questionType = "technical"
) {
  const guidance = DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.Junior;
  const isBehavioral = questionType?.toLowerCase() === "behavioral";

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

Current Question Asked (${questionType} question):
"${question}"

Candidate's Answer:
"${answer}"

Your Task:
1. Provide structured, category-based feedback on the candidate's answer across four distinct criteria:
   - clarity: Is the explanation clear, articulate, and well-structured? (score: integer 1-5, comment: string)
   - technicalAccuracy: Are technical concepts, terminology, syntax, logic, or behavioral reasoning sound and accurate? (score: integer 1-5, comment: string)
   - structure: Is the response organized, logical, and structured effectively? (score: integer 1-5, comment: string)
   - specificity: Did the candidate provide concrete details, specific metrics/examples, or code/system details rather than vague generalizations? (score: integer 1-5, comment: string)

2. Identify the single weakest category ("clarity", "technicalAccuracy", "structure", or "specificity").

3. STAR-Format Detection:
   ${
     isBehavioral
       ? `This is a BEHAVIORAL question. Analyze whether the candidate's answer includes each element of the STAR method:
   - Situation: Did they outline the background context? (boolean)
   - Task: Did they state their responsibility or objective? (boolean)
   - Action: Did they detail the explicit steps THEY took? (boolean)
   - Result: Did they explain the final outcome or impact? (boolean)
   Set "starAnalysis" to an object with keys "situation", "task", "action", "result" (booleans) and "missingParts" (array of strings naming missing STAR components, e.g. ["Action", "Result"]).`
       : `This is a TECHNICAL question. Set "starAnalysis" to null.`
   }

4. Targeted Follow-up Question:
   CRITICAL REQUIREMENT: The "nextQuestion" MUST specifically probe or follow up on whatever "weakestCategory" identifies above. For example, if "specificity" is weakest, ask candidate to provide concrete metrics or code details; if "technicalAccuracy" is weakest, challenge the flaw or ask for clarification on the inaccurate concept. Do NOT ask a generic next topic.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "feedback": {
    "clarity": { "score": 4, "comment": "Clear explanation..." },
    "technicalAccuracy": { "score": 3, "comment": "Accurate concepts but..." },
    "structure": { "score": 4, "comment": "Good logical flow..." },
    "specificity": { "score": 2, "comment": "Lacks specific details..." }
  },
  "weakestCategory": "specificity",
  "starAnalysis": ${
    isBehavioral
      ? `{
    "situation": true,
    "task": true,
    "action": false,
    "result": false,
    "missingParts": ["Action", "Result"]
  }`
      : `null`
  },
  "nextQuestion": "Your targeted follow-up question directly addressing the weakest area here"
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
Classify the question as either "technical" or "behavioral".

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "question": "Your tailored interview question referencing their resume here",
  "questionType": "technical"
}`;
}

/**
 * Builds the prompt for an end-of-session summary evaluating overall performance.
 * 
 * @param {Array} turns - Array of turn objects [{ question, answer, feedback }]
 * @returns {string} The formatted prompt string
 */
export function buildSessionSummaryPrompt(turns = []) {
  const formattedTranscript = turns
    .map((turn, index) => {
      const feedbackStr =
        typeof turn.feedback === "string"
          ? turn.feedback
          : JSON.stringify(turn.feedback);
      return `Turn #${index + 1}:
Question: ${turn.question}
Candidate Answer: ${turn.answer}
Feedback Given: ${feedbackStr}`;
    })
    .join("\n\n---\n\n");

  return `You are a senior technical interviewer and engineering manager.

Analyze the candidate's performance across the entire completed mock interview session:

Full Interview Session Transcript:
"""
${formattedTranscript}
"""

Your Task:
Provide a concise, comprehensive end-of-session summary of the candidate's overall interview performance.
1. overallStrengths: List 2 to 4 key strengths demonstrated across their answers.
2. overallWeaknesses: List 2 to 4 key areas where their answers fell short or need refinement.
3. studyPlan: Recommend 2 to 3 concrete, specific topics, concepts, or frameworks they should study and review before their actual interview.

Output Format:
You MUST respond with a strictly valid JSON object ONLY, with no surrounding markdown or explanation, following this exact schema:
{
  "overallStrengths": [
    "Strong understanding of backend caching strategies",
    "Clear communication style"
  ],
  "overallWeaknesses": [
    "Lacked quantitative metrics in behavioral responses",
    "Missed edge case handling in system scalability discussion"
  ],
  "studyPlan": [
    "Review STAR method response framing for leadership questions",
    "Practice database transaction isolation levels and concurrency control",
    "Study API rate-limiting patterns (token bucket vs leaky bucket)"
  ]
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

