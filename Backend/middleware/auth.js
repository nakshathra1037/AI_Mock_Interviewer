import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Auth Middleware
 * Reads JWT from Authorization: Bearer <token> header,
 * verifies it using JWT_SECRET, and attaches req.userId (and req.user) to the request.
 * Returns 401 if token is missing or invalid.
 */
export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({ error: "Authorization header missing. Please log in." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({ error: "Invalid authorization format. Format must be 'Bearer <token>'." });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || "ai_mock_interviewer_phase2_secret_key_jwt_2026";

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired session token. Please log in again." });
      }

      // Attach userId and decoded user info to request
      req.userId = decoded.userId || decoded.id;
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Authentication failed. Please log in again." });
  }
}

export default authenticateToken;
