import { Router, raw } from "express";
import { uploadImage } from "../services/media.js";
import { validImageUrl } from "../services/content.js";
import {
  validHttpsUrl,
  validMapUrl,
  resolveMapEmbed,
} from "../services/location.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { pool } from "../config/db.js";
import { auth } from "../middlewares/auth.js";
import membership from "./membership.js";
import {
  wrap,
  publicContent,
  list,
  save,
  remove,
  submit,
} from "../controllers/content.js";
const router = Router();
router.use(membership);
router.get(
  "/health",
  wrap(async (req, res) => {
    await pool.query("SELECT 1 FROM settings LIMIT 1");
    res.json({ status: "ok" });
  }),
);
router.get("/content", publicContent);
router.post(
  "/requests",
  rateLimit({
    windowMs: 60000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Veuillez patienter avant de renouveler votre demande.",
    },
  }),
  submit,
);
router.post(
  "/auth/login",
  rateLimit({
    windowMs: 900000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Trop de tentatives. Réessayez dans 15 minutes." },
  }),
  wrap(async (req, res) => {
    const { email, password } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 250
    )
      return res.status(400).json({ message: "Identifiants invalides." });
    const [users] = await pool.execute("SELECT * FROM admins WHERE email=?", [
      email,
    ]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res
        .status(401)
        .json({ message: "E-mail ou mot de passe incorrect." });
    res.json({
      token: jwt.sign({ version: user.token_version }, process.env.JWT_SECRET, {
        subject: String(user.id),
        expiresIn: "4h",
        algorithm: "HS256",
      }),
      name: user.name,
    });
  }),
);
router.use("/admin", auth);
router.post(
  "/admin/media",
  raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "32mb" }),
  wrap(uploadImage),
);
router.get("/admin/me", (req, res) => res.json({ id: req.admin.id }));
router.post(
  "/admin/password",
  wrap(async (req, res) => {
    const { current, password } = req.body;
    if (
      typeof current !== "string" ||
      typeof password !== "string" ||
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    )
      return res.status(400).json({
        message:
          "Le nouveau mot de passe doit contenir entre 12 et 72 caractères.",
      });
    const [rows] = await pool.execute(
      "SELECT password_hash FROM admins WHERE id=?",
      [req.admin.id],
    );
    if (!(await bcrypt.compare(current, rows[0].password_hash)))
      return res
        .status(400)
        .json({ message: "Mot de passe actuel incorrect." });
    await pool.execute(
      "UPDATE admins SET password_hash=?,token_version=token_version+1 WHERE id=?",
      [await bcrypt.hash(password, 12), req.admin.id],
    );
    res.json({ message: "Mot de passe modifié. Reconnectez-vous." });
  }),
);
router.get(
  "/admin/requests",
  wrap(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT r.*,s.name AS school_name FROM requests r LEFT JOIN schools s ON s.id=r.school_id ORDER BY r.created_at DESC",
    );
    res.json(rows);
  }),
);
router.patch(
  "/admin/requests/:id",
  wrap(async (req, res) => {
    if (!["new", "in_progress", "done"].includes(req.body.status))
      return res.status(400).json({ message: "Statut invalide." });
    const [r] = await pool.execute("UPDATE requests SET status=? WHERE id=?", [
      req.body.status,
      req.params.id,
    ]);
    if (!r.affectedRows)
      return res.status(404).json({ message: "Demande introuvable." });
    res.json({ message: "Statut mis à jour." });
  }),
);
router.delete(
  "/admin/requests/:id",
  wrap(async (req, res) => {
    const [r] = await pool.execute("DELETE FROM requests WHERE id=?", [
      req.params.id,
    ]);
    if (!r.affectedRows)
      return res.status(404).json({ message: "Demande introuvable." });
    res.status(204).end();
  }),
);
router.get(
  "/admin/settings",
  wrap(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id=1");
    res.json(rows[0]);
  }),
);
router.put(
  "/admin/settings",
  wrap(async (req, res) => {
    const fields = [
      "church_name",
      "tagline",
      "welcome_text",
      "address",
      "service_times",
      "hero_image",
      "map_url",
      "map_embed_url",
      "donation_url",
      "donation_qr_image",
    ];
    for (const key of [
      "map_url",
      "map_embed_url",
      "donation_url",
      "donation_qr_image",
    ])
      req.body[key] ??= "";
    if (req.body.map_url && !validMapUrl(req.body.map_url))
      return res
        .status(400)
        .json({ message: "Utilisez un lien HTTPS Google Maps." });
    if (req.body.donation_url && !validHttpsUrl(req.body.donation_url))
      return res
        .status(400)
        .json({ message: "Le lien de don doit utiliser une URL HTTPS." });
    if (
      req.body.donation_qr_image &&
      !validImageUrl(req.body.donation_qr_image)
    )
      return res
        .status(400)
        .json({ message: "Importez le QR code ou utilisez une image HTTPS." });
    if (
      req.body.map_embed_url &&
      (!validMapUrl(req.body.map_embed_url) ||
        !(
          new URL(req.body.map_embed_url).pathname.startsWith("/maps/embed") ||
          new URL(req.body.map_embed_url).searchParams.get("output") === "embed"
        ))
    )
      return res.status(400).json({
        message: "Utilisez l’URL Google Maps /maps/embed de la carte intégrée.",
      });
    if (req.body.map_url && !req.body.map_embed_url) {
      try {
        req.body.map_embed_url = await resolveMapEmbed(req.body.map_url);
      } catch {
        return res
          .status(400)
          .json({
            message:
              "Impossible de préparer la carte à partir de ce lien. Dans Google Maps, choisissez Partager > Intégrer une carte, puis copiez l’adresse src dans le champ URL de carte intégrée.",
          });
      }
    }
    const values = fields.map((k) => req.body[k]);
    if (
      values.some((v) => typeof v !== "string" || v.length > 4000) ||
      (typeof values[0] === "string" && values[0].length > 255) ||
      !values[0].trim()
    )
      return res.status(400).json({ message: "Informations invalides." });
    if (req.body.hero_image && !validImageUrl(req.body.hero_image))
      return res
        .status(400)
        .json({ message: "L’image doit utiliser une URL HTTPS." });
    await pool.execute(
      `UPDATE settings SET ${fields.map((k) => `${k}=?`).join(",")} WHERE id=1`,
      values,
    );
    res.json({ message: "Informations enregistrées." });
  }),
);
router.get("/admin/content/:resource", list);
router.post("/admin/content/:resource", save);
router.put("/admin/content/:resource/:id", save);
router.delete("/admin/content/:resource/:id", remove);
export default router;
