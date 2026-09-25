import pool from "../db/connection.js";
import {
  buildResumeTailoredQuestionPrompt,
  buildResumeFitAnalysisPrompt,
  buildRoleSuggestionsPrompt
} from "../prompts/interviewPrompts.js";

async function testPhase3() {
  console.log("🧪 Testing Phase 3 Backend Features...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Prompt builders
  try {
    const resume = "Experienced in Node.js, Express, Docker, MySQL, and building scalable REST APIs.";
    const jd = "Looking for a Backend Developer with Node.js and Kubernetes experience.";

    const tailoredPrompt = buildResumeTailoredQuestionPrompt("Backend Engineer", "Mid", resume);
    assert(tailoredPrompt.includes("Candidate's Resume Profile:"), "Tailored prompt includes resume section");
    assert(tailoredPrompt.includes("Mid"), "Tailored prompt includes difficulty");

    const fitPrompt = buildResumeFitAnalysisPrompt(resume, jd);
    assert(fitPrompt.includes("Target Job Description:"), "Fit prompt includes job description");
    assert(fitPrompt.includes("fitScore"), "Fit prompt includes fitScore JSON schema");

    const suggestionsPrompt = buildRoleSuggestionsPrompt(resume);
    assert(suggestionsPrompt.includes("recommendations"), "Suggestions prompt includes recommendations schema");
  } catch (err) {
    console.error("Test 1 error:", err);
    failed++;
  }

  // Test 2: Database resumes table insert & update
  try {
    // Look up an existing test user or create a temporary one
    let [users] = await pool.query("SELECT id FROM users LIMIT 1");
    let testUserId;
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      const [uRes] = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES ('Test User', 'test_resume_user@example.com', 'hash')"
      );
      testUserId = uRes.insertId;
    }

    // Insert first resume
    await pool.query(
      `INSERT INTO resumes (user_id, resume_text, file_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         resume_text = VALUES(resume_text),
         file_name = VALUES(file_name),
         uploaded_at = CURRENT_TIMESTAMP`,
      [testUserId, "Initial Resume Content for Node.js Engineer", "resume_v1.pdf"]
    );

    const [rows1] = await pool.query("SELECT * FROM resumes WHERE user_id = ?", [testUserId]);
    assert(rows1.length === 1, "Resume row created");
    assert(rows1[0].file_name === "resume_v1.pdf", "File name recorded accurately");

    // Replace existing resume (ON DUPLICATE KEY UPDATE)
    await pool.query(
      `INSERT INTO resumes (user_id, resume_text, file_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         resume_text = VALUES(resume_text),
         file_name = VALUES(file_name),
         uploaded_at = CURRENT_TIMESTAMP`,
      [testUserId, "Updated Resume Content for Senior Engineer", "resume_v2.docx"]
    );

    const [rows2] = await pool.query("SELECT * FROM resumes WHERE user_id = ?", [testUserId]);
    assert(rows2.length === 1, "Still exactly 1 resume row per user (no duplicate)");
    assert(rows2[0].file_name === "resume_v2.docx", "File name updated to resume_v2.docx");
    assert(rows2[0].resume_text.includes("Senior"), "Resume text updated successfully");
  } catch (err) {
    console.error("Test 2 error:", err);
    failed++;
  }

  console.log(`\n=========================================`);
  console.log(`Phase 3 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

testPhase3();
