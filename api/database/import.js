import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";
import "../config/db.js";
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true,
});
try {
  const database = process.env.DB_NAME || "vase_honneur";
  await connection.query("CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", [database]);
  await connection.query("USE ??", [database]);
  if (process.argv.includes("--reset")) {
    await connection.query(readFileSync(new URL("./reset.sql", import.meta.url), "utf8"));
  } else {
    const [tables] = await connection.query("SHOW TABLES");
    if (tables.length) throw new Error("La base contient déjà des tables. Sauvegarder puis utiliser --reset, ou sélectionner une base vide.");
  }
  await connection.query(
    readFileSync(new URL("../../schema.sql", import.meta.url), "utf8"),
  );
  console.log("Base initialisée.");
} finally {
  await connection.end();
}
