import { writeFileSync } from "node:fs";
const groups = [
  [
    "Expansion",
    "Évangélisation|Eden Sports|Familles d’Honneur|Smalahs|Cellule / Maison d’Honneur",
  ],
  [
    "Intégration",
    "Tribus|Amis des Nouveaux (ADN)|Amis de l’Assemblée|RAM – Réseau des Anciens Musulmans|Classes de baptême|Coordination GEM",
  ],
  ["Affermissement", "Plume d’Honneur|Académie d’Honneur|Porteurs de Vie|MRES"],
  ["Intimité", "Intercession|Sainte Cène|Groupes musicaux"],
  [
    "Famille",
    "Leaman|Enfant d’Honneur|Kanegnon|Jeunesse|Bloom|Seniors|Eden 1 / Single|Eden 2 / Fiancés|Couples d’Honneur",
  ],
  [
    "Assistance",
    "RESHO|Cœur d’Honneur|ELEEO|Médecine d’Honneur|ONG Pour Sauver|Torrent d’Amour|Visites pastorales",
  ],
  [
    "Administration",
    "Administration|Moyens Généraux|CODEVH|Comptage|Sonorisation|Communication|Informatique et Internet",
  ],
  [
    "Culte et Programmes Spéciaux",
    "Portiers|Gestion des cultes|Interprétariat|Traduction|Dirigeants|Organisation des programmes|Décoration",
  ],
];
const q = (v) =>
  v === null ? "NULL" : "'" + String(v).replaceAll("'", "''") + "'";
let sql = `-- Vase d’honneur — installation dans une base vide MySQL 8 / MariaDB 10.4+
-- Dans phpMyAdmin, sélectionner la base vase_honneur avant cet import.
-- Ce fichier ne supprime aucune table et ne répare pas un stockage corrompu.
-- Aucun compte administrateur par défaut. Utiliser npm run create-admin.
CREATE TABLE IF NOT EXISTS admins (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,email VARCHAR(190) NOT NULL UNIQUE,name VARCHAR(190) NOT NULL,password_hash VARCHAR(255) NOT NULL,token_version INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY,church_name VARCHAR(255) NOT NULL,tagline TEXT NOT NULL,welcome_text TEXT NOT NULL,address TEXT NOT NULL,service_times TEXT NOT NULL,hero_image TEXT NOT NULL);
`;
const common =
  "id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
for (const [table, extra] of Object.entries({
  churches: "address VARCHAR(500),phone VARCHAR(100),image_url VARCHAR(500)",
  tours: "image_url VARCHAR(500)",
  panoramas:
    "tour_id INT UNSIGNED NOT NULL,image_url VARCHAR(500) NOT NULL,FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE RESTRICT",
  ministries: "icon VARCHAR(100)",
  departments:
    "ministry_id INT UNSIGNED NOT NULL,leader VARCHAR(255),phone VARCHAR(100),FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE RESTRICT",
  schools: "schedule VARCHAR(500),location VARCHAR(500)",
  contacts: "phone VARCHAR(100),email VARCHAR(255),kind VARCHAR(100)",
  events: "starts_at DATETIME,location VARCHAR(500)",
  pastors: "role VARCHAR(255),image_url VARCHAR(500)",
  cells:
    "location VARCHAR(500),leader VARCHAR(255),phone VARCHAR(100),schedule VARCHAR(500)",
}))
  sql += `CREATE TABLE IF NOT EXISTS ${table} (${common},${extra});\n`;
sql += `CREATE TABLE IF NOT EXISTS requests (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,type ENUM('appointment','enrollment','prayer','testimony') NOT NULL,first_name VARCHAR(255) NOT NULL,last_name VARCHAR(255) NOT NULL,sex VARCHAR(50),need_type VARCHAR(100),reason TEXT,phone VARCHAR(100),email VARCHAR(255),preferred_date DATE,school_id INT UNSIGNED,status ENUM('new','in_progress','done') NOT NULL DEFAULT 'new',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,INDEX (status,created_at));\n`;
sql += `INSERT IGNORE INTO settings VALUES (1,'Vase d’honneur','Une église. Une famille. Une place pour vous.','Bienvenue au Centre Eden. Découvrez notre famille, grandissez dans la foi et trouvez votre place parmi nous.','','','');\n`;
sql +=
  "INSERT IGNORE INTO churches (id,name,description,sort_order) VALUES (1,'Vases d’honneur · Centre Eden','Bienvenue dans notre famille. Découvrez nos ministères et nos parcours d’accompagnement.',0);\n";
let dept = 0;
groups.forEach(([name, departments], i) => {
  sql += `INSERT IGNORE INTO ministries (id,name,sort_order) VALUES (${i + 1},${q("Ministère de " + (name === "Expansion" ? "l’Expansion" : name === "Intégration" ? "l’Intégration" : name === "Affermissement" ? "l’Affermissement" : name === "Intimité" ? "l’Intimité" : name === "Assistance" ? "l’Assistance" : name === "Administration" ? "l’Administration" : name === "Famille" ? "la Famille" : "Culte et des Programmes Spéciaux"))},${i});\n`;
  departments.split("|").forEach((name) => {
    dept++;
    sql += `INSERT IGNORE INTO departments (id,name,ministry_id,sort_order) VALUES (${dept},${q(name)},${i + 1},${dept});\n`;
  });
});
["Classe de baptême", "L’Académie d’Honneur", "Porteurs de Vie"].forEach(
  (name, i) =>
    (sql += `INSERT IGNORE INTO schools (id,name,sort_order) VALUES (${i + 1},${q(name)},${i});\n`),
);
const contacts = [
  [
    "Secrétariat",
    "Pour toute information ou pour rencontrer le pasteur.",
    "+225 01 03 88 44 44",
    "vhcentreeden@gmail.com",
    "general",
  ],
  [
    "Servir dans un département",
    "Contactez le responsable du cours de membres et de l’intégration dans les départements.",
    "+225 01 02 20 62 78",
    null,
    "serve",
  ],
  [
    "Prière de délivrance",
    "Besoin de prière de délivrance.",
    "+225 07 77 32 54 05",
    null,
    "prayer",
  ],
  [
    "Intentions de prière",
    "Partagez vos sujets de prière par WhatsApp.",
    "+225 05 05 238 238",
    null,
    "whatsapp",
  ],
  [
    "Accompagnement au mariage",
    "Préparez votre mariage avec un accompagnement.",
    "+225 07 08 94 06 84",
    null,
    "marriage",
  ],
  [
    "Familles d’Honneur",
    "Rejoignez une cellule de maison dans votre quartier.",
    "+225 07 78 03 02 76",
    null,
    "cells",
  ],
  [
    "Intégrer une tribu",
    "Trouvez votre tribu et faites connaissance.",
    "+225 01 40 53 92 61",
    null,
    "tribes",
  ],
  [
    "Partager un témoignage",
    "Vous avez un témoignage à partager ?",
    "+225 07 59 41 95 45",
    null,
    "testimony",
  ],
];
contacts.forEach(
  (c, i) =>
    (sql += `INSERT IGNORE INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (${i + 1},${c.map(q).join(",")},${i});\n`),
);
sql = sql.replaceAll("Ministère de Culte", "Ministère du Culte");
sql = sql.replaceAll("CREATE TABLE IF NOT EXISTS", "CREATE TABLE");
sql = sql.replaceAll("INSERT IGNORE INTO", "INSERT INTO");
sql = sql.replace(
  /(CREATE TABLE [^;]+);/g,
  "$1 ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
);
writeFileSync(new URL("../../schema.sql", import.meta.url), sql);
writeFileSync(new URL("./schema.sql", import.meta.url), sql);
const reset = `-- ATTENTION : supprime les données des tables de l’application.
-- Sauvegarder avant utilisation. Sélectionner vase_honneur dans phpMyAdmin.
-- Puis importer schema.sql. Aucune désactivation des clés étrangères.
${["requests", "panoramas", "departments", "cells", "pastors", "events", "contacts", "schools", "ministries", "tours", "churches", "settings", "admins"].map((table) => `DROP TABLE IF EXISTS ${table};`).join("\n")}
`;
writeFileSync(new URL("./reset.sql", import.meta.url), reset);
console.log(
  "Schéma créé : 8 ministères, " +
    dept +
    " départements, 3 écoles et 8 contacts.",
);
