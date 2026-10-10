import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
const [email, name = "Administration"] = process.argv.slice(2);
const password = process.env.ADMIN_PASSWORD;
if (
  !email ||
  !password ||
  password.length < 12 ||
  Buffer.byteLength(password, "utf8") > 72
) {
  console.error(
    "Définissez ADMIN_PASSWORD (12 à 72 caractères), puis npm run create-admin -- email nom",
  );
  process.exit(1);
}
try {
  await pool.execute(
    "INSERT INTO admins (email,name,password_hash) VALUES (?,?,?)",
    [email, name, await bcrypt.hash(password, 12)],
  );
  console.log("Compte administrateur créé.");
} finally {
  await pool.end();
}
