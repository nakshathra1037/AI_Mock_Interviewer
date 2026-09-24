import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authenticateToken } from "../middleware/auth.js";

async function runTests() {
  console.log("🧪 Starting Phase 2 Backend Verification Tests...\n");
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

  // Test 1: Bcrypt Password Hashing & Verification
  try {
    const rawPassword = "CandidateSecret123!";
    const hash = await bcrypt.hash(rawPassword, 10);
    assert(hash && hash !== rawPassword, "Bcrypt successfully hashed password");
    assert(hash.startsWith("$2b$10$") || hash.startsWith("$2a$10$"), "Bcrypt hash uses 10 salt rounds");

    const validMatch = await bcrypt.compare(rawPassword, hash);
    assert(validMatch === true, "Bcrypt correctly matches valid password");

    const invalidMatch = await bcrypt.compare("WrongPassword", hash);
    assert(invalidMatch === false, "Bcrypt rejects incorrect password");
  } catch (err) {
    console.error("Test 1 error:", err);
    failed++;
  }

  // Test 2: JWT Signing and Verification
  try {
    const secret = "test_secret_key_12345";
    process.env.JWT_SECRET = secret;

    const payload = { userId: 42, name: "Nakshathra", email: "nakshathra@example.com" };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    assert(typeof token === "string" && token.length > 20, "JWT successfully created");

    const decoded = jwt.verify(token, secret);
    assert(decoded.userId === 42, "JWT decoded userId correctly");
    assert(decoded.name === "Nakshathra", "JWT decoded user name correctly");
    assert(decoded.email === "nakshathra@example.com", "JWT decoded user email correctly");
  } catch (err) {
    console.error("Test 2 error:", err);
    failed++;
  }

  // Test 3: Auth Middleware with valid Bearer token
  try {
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: 101, name: "Test Candidate", email: "candidate@test.com" }, secret);

    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    let nextCalled = false;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          throw new Error(`Unexpected res.status(${code}) called: ${JSON.stringify(data)}`);
        }
      })
    };

    authenticateToken(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert(nextCalled === true, "Auth middleware calls next() on valid token");
    assert(mockReq.userId === 101, "Auth middleware attaches req.userId = 101");
    assert(mockReq.user.email === "candidate@test.com", "Auth middleware attaches req.user");
  } catch (err) {
    console.error("Test 3 error:", err);
    failed++;
  }

  // Test 4: Auth Middleware rejects missing token
  try {
    const mockReq = { headers: {} };
    let responseStatus = null;
    let responseBody = null;

    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseBody = data;
          }
        };
      }
    };

    authenticateToken(mockReq, mockRes, () => {});

    assert(responseStatus === 401, "Auth middleware returns 401 when Authorization header is missing");
    assert(responseBody && responseBody.error, "Auth middleware returns clear error message for missing token");
  } catch (err) {
    console.error("Test 4 error:", err);
    failed++;
  }

  // Test 5: Auth Middleware rejects invalid / malformed token
  try {
    const mockReq = {
      headers: {
        authorization: "Bearer invalid.token.string"
      }
    };
    let responseStatus = null;
    let responseBody = null;

    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseBody = data;
          }
        };
      }
    };

    authenticateToken(mockReq, mockRes, () => {});

    assert(responseStatus === 401, "Auth middleware returns 401 on invalid token");
    assert(responseBody && responseBody.error, "Auth middleware returns clear JSON error on invalid token");
  } catch (err) {
    console.error("Test 5 error:", err);
    failed++;
  }

  console.log(`\n=========================================`);
  console.log(`Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
