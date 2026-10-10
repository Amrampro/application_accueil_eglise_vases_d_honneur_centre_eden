import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
export async function auth(req, res, next) {
  try {
    const payload = jwt.verify(
      req.headers.authorization?.replace(/^Bearer /, ""),
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
    );
    const [users] = await pool.execute(
      "SELECT id,token_version FROM admins WHERE id=?",
      [payload.sub],
    );
    if (!users[0] || users[0].token_version !== payload.version)
      return res
        .status(401)
        .json({ message: "Session expirée. Reconnectez-vous." });
    req.admin = users[0];
    next();
  } catch (error) {
    if (error.code) return next(error);
    res.status(401).json({ message: "Veuillez vous connecter." });
  }
}
