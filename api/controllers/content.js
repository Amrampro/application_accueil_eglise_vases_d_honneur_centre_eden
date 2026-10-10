import { pool } from "../config/db.js";
import {
  resources,
  validateContent,
  validateRequest,
} from "../services/content.js";
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const publicContent = wrap(async (req, res) => {
  const result = {};
  for (const key of Object.keys(resources)) {
    const [rows] = await pool.query(
      key === "departments"
        ? "SELECT d.* FROM departments d JOIN ministries m ON m.id=d.ministry_id WHERE d.published=1 AND m.published=1 ORDER BY d.sort_order,d.id"
        : key === "panoramas"
          ? "SELECT p.* FROM panoramas p JOIN tours t ON t.id=p.tour_id WHERE p.published=1 AND t.published=1 ORDER BY p.sort_order,p.id"
          : `SELECT * FROM ${key} WHERE published=1 ORDER BY sort_order,id`,
    );
    result[key] = rows;
  }
  const [settings] = await pool.query("SELECT * FROM settings WHERE id=1");
  if (!settings[0])
    return res.status(503).json({
      message:
        "Importez schema.sql pour initialiser les informations de l’église.",
    });
  result.settings = settings[0];
  res.json(result);
});
export const list = wrap(async (req, res) => {
  const key = req.params.resource;
  if (!Object.hasOwn(resources, key))
    return res.status(404).json({ message: "Rubrique inconnue." });
  const [rows] = await pool.query(
    `SELECT * FROM ${key} ORDER BY sort_order,id`,
  );
  res.json(rows);
});
export const save = wrap(async (req, res) => {
  const key = req.params.resource;
  const values = validateContent(key, req.body);
  const keys = Object.keys(values);
  if (req.params.id) {
    const [r] = await pool.execute(
      `UPDATE ${key} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`,
      [...Object.values(values), req.params.id],
    );
    if (!r.affectedRows)
      return res.status(404).json({ message: "Élément introuvable." });
    res.json({ id: Number(req.params.id) });
  } else {
    const [r] = await pool.execute(
      `INSERT INTO ${key} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      Object.values(values),
    );
    res.status(201).json({ id: r.insertId });
  }
});
export const remove = wrap(async (req, res) => {
  const key = req.params.resource;
  if (!Object.hasOwn(resources, key))
    return res.status(404).json({ message: "Rubrique inconnue." });
  const [r] = await pool.execute(`DELETE FROM ${key} WHERE id=?`, [
    req.params.id,
  ]);
  if (!r.affectedRows)
    return res.status(404).json({ message: "Élément introuvable." });
  res.status(204).end();
});
export const submit = wrap(async (req, res) => {
  const values = validateRequest(req.body);
  if (values.school_id) {
    const [rows] = await pool.execute(
      "SELECT id FROM schools WHERE id=? AND published=1",
      [values.school_id],
    );
    if (!rows.length)
      return res
        .status(400)
        .json({ message: "Cette école n’est pas disponible." });
  }
  await pool.execute(
    `INSERT INTO requests (${Object.keys(values).join(",")}) VALUES (${Object.keys(
      values,
    )
      .map(() => "?")
      .join(",")})`,
    Object.values(values),
  );
  res.status(201).json({
    message:
      "Votre demande a été enregistrée. L’équipe vous accompagnera dans la suite de votre démarche.",
  });
});
