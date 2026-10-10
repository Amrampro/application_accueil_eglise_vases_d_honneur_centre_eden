
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(directory, "../.env")
});

const migrationsDir = path.join(directory, "migrations");

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vase_honneur",
    charset: "utf8mb4",
    multipleStatements: true
  });

  let locked = false;

  try {
    const [rows] = await db.query(
      "SELECT GET_LOCK(?, 30) AS acquired",
      ["vase_honneur_migrations"]
    );

    if (rows[0].acquired !== 1) {
      throw new Error("Verrouillage des migrations impossible");
    }

    locked = true;

    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files = (await fs.readdir(migrationsDir))
      .filter(file => file.endsWith(".sql"))
      .sort();

    for (const filename of files) {
      const sql = await fs.readFile(
        path.join(migrationsDir, filename),
        "utf8"
      );

      const checksum = crypto
        .createHash("sha256")
        .update(sql)
        .digest("hex");

      const [existing] = await db.query(
        "SELECT checksum FROM schema_migrations WHERE filename = ?",
        [filename]
      );

      if (existing.length > 0) {
        if (existing[0].checksum !== checksum) {
          throw new Error(
            `Migration modifiee apres execution : ${filename}`
          );
        }

        console.log(`IGNORE : ${filename}`);
        continue;
      }

      console.log(`EXECUTION : ${filename}`);

      await db.query(sql);

      await db.query(
        "INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)",
        [filename, checksum]
      );

      console.log(`TERMINE : ${filename}`);
    }

    console.log("Migrations terminees avec succes.");
  } finally {
    if (locked) {
      await db.query(
        "SELECT RELEASE_LOCK(?)",
        ["vase_honneur_migrations"]
      );
    }

    await db.end();
  }
}

migrate().catch(error => {
  console.error("ERREUR MIGRATION :", error);
  process.exitCode = 1;
});
