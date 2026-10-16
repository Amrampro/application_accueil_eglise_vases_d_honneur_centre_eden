-- Vase d’honneur — installation dans une base vide MySQL 8 / MariaDB 10.4+
-- Dans phpMyAdmin, sélectionner la base vase_honneur avant cet import.
-- Ce fichier ne supprime aucune table et ne répare pas un stockage corrompu.
-- Aucun compte administrateur par défaut. Utiliser npm run create-admin.
CREATE TABLE admins (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,email VARCHAR(190) NOT NULL UNIQUE,name VARCHAR(190) NOT NULL,password_hash VARCHAR(255) NOT NULL,token_version INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE settings (id INT PRIMARY KEY,church_name VARCHAR(255) NOT NULL,tagline TEXT NOT NULL,welcome_text TEXT NOT NULL,address TEXT NOT NULL,service_times TEXT NOT NULL,hero_image TEXT NOT NULL,map_url TEXT NOT NULL DEFAULT '',map_embed_url TEXT NOT NULL DEFAULT '',donation_url TEXT NOT NULL DEFAULT '',donation_qr_image TEXT NOT NULL DEFAULT '') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE churches (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,address VARCHAR(500),phone VARCHAR(100),image_url VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE tours (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,image_url VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE panoramas (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,tour_id INT UNSIGNED NOT NULL,image_url VARCHAR(500) NOT NULL,FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE ministries (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,icon VARCHAR(100)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE departments (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,ministry_id INT UNSIGNED NOT NULL,leader VARCHAR(255),phone VARCHAR(100),FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE schools (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,schedule VARCHAR(500),location VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE contacts (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,phone VARCHAR(100),email VARCHAR(255),kind VARCHAR(100)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE events (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,starts_at DATETIME,location VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE pastors (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,role VARCHAR(255),image_url VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cells (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255) NOT NULL,description TEXT,published BOOLEAN NOT NULL DEFAULT 1,sort_order INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,location VARCHAR(500),leader VARCHAR(255),phone VARCHAR(100),schedule VARCHAR(500)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE requests (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,type ENUM('appointment','enrollment','prayer','testimony') NOT NULL,first_name VARCHAR(255) NOT NULL,last_name VARCHAR(255) NOT NULL,sex VARCHAR(50),need_type VARCHAR(100),reason TEXT,phone VARCHAR(100),email VARCHAR(255),preferred_date DATE,school_id INT UNSIGNED,status ENUM('new','in_progress','done') NOT NULL DEFAULT 'new',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,INDEX (status,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO settings (id,church_name,tagline,welcome_text,address,service_times,hero_image) VALUES (1,'Église Vases d''Honneur Centre Éden','Une église. Une famille. Une place pour vous.','Bienvenue au Centre Eden. Découvrez notre famille, grandissez dans la foi et trouvez votre place parmi nous.','','','');
INSERT INTO churches (id,name,description,sort_order) VALUES (1,'Vases d’honneur · Centre Eden','Bienvenue dans notre famille. Découvrez nos ministères et nos parcours d’accompagnement.',0);
INSERT INTO ministries (id,name,sort_order) VALUES (1,'Ministère de l’Expansion',0);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (1,'Évangélisation',1,1);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (2,'Eden Sports',1,2);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (3,'Familles d’Honneur',1,3);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (4,'Smalahs',1,4);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (5,'Cellule / Maison d’Honneur',1,5);
INSERT INTO ministries (id,name,sort_order) VALUES (2,'Ministère de l’Intégration',1);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (6,'Tribus',2,6);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (7,'Amis des Nouveaux (ADN)',2,7);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (8,'Amis de l’Assemblée',2,8);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (9,'RAM – Réseau des Anciens Musulmans',2,9);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (10,'Classes de baptême',2,10);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (11,'Coordination GEM',2,11);
INSERT INTO ministries (id,name,sort_order) VALUES (3,'Ministère de l’Affermissement',2);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (12,'Plume d’Honneur',3,12);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (13,'Académie d’Honneur',3,13);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (14,'Porteurs de Vie',3,14);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (15,'MRES',3,15);
INSERT INTO ministries (id,name,sort_order) VALUES (4,'Ministère de l’Intimité',3);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (16,'Intercession',4,16);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (17,'Sainte Cène',4,17);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (18,'Groupes musicaux',4,18);
INSERT INTO ministries (id,name,sort_order) VALUES (5,'Ministère de la Famille',4);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (19,'Leaman',5,19);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (20,'Enfant d’Honneur',5,20);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (21,'Kanegnon',5,21);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (22,'Jeunesse',5,22);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (23,'Bloom',5,23);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (24,'Seniors',5,24);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (25,'Eden 1 / Single',5,25);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (26,'Eden 2 / Fiancés',5,26);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (27,'Couples d’Honneur',5,27);
INSERT INTO ministries (id,name,sort_order) VALUES (6,'Ministère de l’Assistance',5);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (28,'RESHO',6,28);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (29,'Cœur d’Honneur',6,29);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (30,'ELEEO',6,30);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (31,'Médecine d’Honneur',6,31);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (32,'ONG Pour Sauver',6,32);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (33,'Torrent d’Amour',6,33);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (34,'Visites pastorales',6,34);
INSERT INTO ministries (id,name,sort_order) VALUES (7,'Ministère de l’Administration',6);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (35,'Administration',7,35);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (36,'Moyens Généraux',7,36);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (37,'CODEVH',7,37);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (38,'Comptage',7,38);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (39,'Sonorisation',7,39);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (40,'Communication',7,40);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (41,'Informatique et Internet',7,41);
INSERT INTO ministries (id,name,sort_order) VALUES (8,'Ministère du Culte et des Programmes Spéciaux',7);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (42,'Portiers',8,42);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (43,'Gestion des cultes',8,43);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (44,'Interprétariat',8,44);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (45,'Traduction',8,45);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (46,'Dirigeants',8,46);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (47,'Organisation des programmes',8,47);
INSERT INTO departments (id,name,ministry_id,sort_order) VALUES (48,'Décoration',8,48);
INSERT INTO schools (id,name,sort_order) VALUES (1,'Classe de baptême',0);
INSERT INTO schools (id,name,sort_order) VALUES (2,'L’Académie d’Honneur',1);
INSERT INTO schools (id,name,sort_order) VALUES (3,'Porteurs de Vie',2);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (1,'Secrétariat','Pour toute information ou pour rencontrer le pasteur.','+225 01 03 88 44 44','vhcentreeden@gmail.com','general',0);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (2,'Servir dans un département','Contactez le responsable du cours de membres et de l’intégration dans les départements.','+225 01 02 20 62 78',NULL,'serve',1);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (3,'Prière de délivrance','Besoin de prière de délivrance.','+225 07 77 32 54 05',NULL,'prayer',2);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (4,'Intentions de prière','Partagez vos sujets de prière par WhatsApp.','+225 05 05 238 238',NULL,'whatsapp',3);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (5,'Accompagnement au mariage','Préparez votre mariage avec un accompagnement.','+225 07 08 94 06 84',NULL,'marriage',4);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (6,'Familles d’Honneur','Rejoignez une cellule de maison dans votre quartier.','+225 07 78 03 02 76',NULL,'cells',5);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (7,'Intégrer une tribu','Trouvez votre tribu et faites connaissance.','+225 01 40 53 92 61',NULL,'tribes',6);
INSERT INTO contacts (id,name,description,phone,email,kind,sort_order) VALUES (8,'Partager un témoignage','Vous avez un témoignage à partager ?','+225 07 59 41 95 45',NULL,'testimony',7);

CREATE TABLE decision_today (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 decision_number INT UNSIGNED NOT NULL UNIQUE,
 meaning VARCHAR(500) NOT NULL,
 directive TEXT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE members (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(255) NOT NULL,
 sex ENUM('male','female') NOT NULL,
 neighborhood VARCHAR(255) NOT NULL DEFAULT '',
 municipality VARCHAR(255) NOT NULL DEFAULT '',
 phone VARCHAR(40) NOT NULL,
 phone_normalized VARCHAR(20) NOT NULL,
 profession VARCHAR(255) NOT NULL DEFAULT '',
 community VARCHAR(255) NOT NULL DEFAULT '',
 attends_regularly BOOLEAN NOT NULL DEFAULT 0,
 referral_channels TEXT NOT NULL,
 referrer_name VARCHAR(255) NOT NULL DEFAULT '',
 referrer_contact VARCHAR(255) NOT NULL DEFAULT '',
 referral_other VARCHAR(500) NOT NULL DEFAULT '',
 age_range VARCHAR(20) NOT NULL,
 marital_status VARCHAR(30) NOT NULL,
 service_number VARCHAR(30) NOT NULL DEFAULT '',
 notes TEXT NOT NULL,
 joined_on DATE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 token_version INT NOT NULL DEFAULT 0,
 identity_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX (joined_on,id), INDEX (phone_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE member_decisions (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 member_id INT UNSIGNED NOT NULL,
 decision_id INT UNSIGNED NULL,
 decision_number INT UNSIGNED NOT NULL,
 meaning VARCHAR(500) NOT NULL,
 directive TEXT NOT NULL,
 FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
 FOREIGN KEY (decision_id) REFERENCES decision_today(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE member_groups (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 description TEXT NOT NULL,
 leader_id INT UNSIGNED NOT NULL,
 assistant_id INT UNSIGNED NULL,
 coordinator_id INT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (leader_id) REFERENCES members(id) ON DELETE RESTRICT,
 FOREIGN KEY (assistant_id) REFERENCES members(id) ON DELETE RESTRICT,
 FOREIGN KEY (coordinator_id) REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE group_members (
 group_id INT UNSIGNED NOT NULL,
 member_id INT UNSIGNED NOT NULL,
 added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (group_id,member_id),
 FOREIGN KEY (group_id) REFERENCES member_groups(id) ON DELETE CASCADE,
 FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE member_actions (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 member_id INT UNSIGNED NOT NULL,
 group_id INT UNSIGNED NULL,
 group_name VARCHAR(255) NOT NULL,
 kind ENUM('call','visit','message') NOT NULL,
 status ENUM('planned','completed') NOT NULL,
 scheduled_at DATETIME NOT NULL,
 completed_at DATETIME NULL,
 observation TEXT NOT NULL,
 actor_member_id INT UNSIGNED NULL,
 actor_admin_id INT UNSIGNED NULL,
 actor_name VARCHAR(255) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
 FOREIGN KEY (group_id) REFERENCES member_groups(id) ON DELETE SET NULL,
 FOREIGN KEY (actor_member_id) REFERENCES members(id) ON DELETE SET NULL,
 FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
 INDEX (member_id,scheduled_at), INDEX (group_id,scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO decision_today (decision_number,meaning,directive) VALUES
(1,'Je donne ma vie à Jésus-Christ','L’aider à accepter Jésus sur le champ, lui faire comprendre la nécessité d’être dans une famille chrétienne pour apprendre à grandir dans sa marche avec Christ, l’encourager à participer aux cultes, l’orienter au cours de baptême, la tribu qui recrute et une famille d’honneur. N.B. : pour la prière de conversion, l’amener à la repentance et faire la prière avec lui (versets conseillés : Jean 3:16, Romains 10:9-10, 1 Jean 5:12-13, Colossiens 2:13-15, etc.).'),
(2,'Je veux être baptisé(e)','L’orienter au cours de baptême, l’encourager à faire le prochain cours de membres (cours d’explication de la vision et de l’organisation de l’église) et lui présenter les activités de l’église (voir les directives de la décision 8).'),
(3,'Je veux rencontrer l’équipe de la délivrance','L’écouter pour connaître son besoin de délivrance, l’encourager dans sa marche avec Christ et l’orienter au MRES (mercredi de 10 h à 16 h). Transmettre son nom et son contact au… [Fin de la directive non visible sur la capture : à compléter.]'),
(4,'J’ai besoin de suivi (encadrement)','Répondre à son besoin de suivi si possible, l’orienter vers le MRES ou un pasteur suivant le cas, et l’orienter vers la tribu qui recrute et une famille d’honneur. L’encourager à participer aux… [Fin de la directive non visible sur la capture : à compléter.]'),
(5,'Je décide d’être membre de Vases d’Honneur','Être membre de Vases d’Honneur commence d’abord par remplir la fiche d’identification, ensuite participer aux cultes et enfin intégrer une tribu et une famille d’honneur. L’orienter dans la tribu en recrutement et l’encourager à faire le baptême et le prochain cours de membres (cours d’explication de la vision et de l’organisation de l’église) et lui présenter les activités de l’église.'),
(6,'Je suis indécis(e)','Échanger avec la personne suivant les décisions qu’elle a cochées, l’encourager à suivre le thème des messages en cours d’enseignement et lui présenter les activités de l’église (voir les directives de la décision 8).'),
(7,'Je désire un entretien avec un pasteur','L’écouter pour répondre à son besoin et l’orienter suivant la délicatesse du sujet (MRES, pasteur…).'),
(8,'Je veux connaître les activités de l’église','Donner les informations sur l’église : les tribus, cadre d’intégration et de communion fraternelle ; les familles d’honneur pour partager et communier avec ses frères et sœurs de l’église habitant dans le même quartier ; les départements, environnement favorable à l’exercice de nos dons et talents ; les activités de l’église (cultes du dimanche et mercredi, croisades d’évangélisation, veillées de prière, cœur à cœur — programmes d’adoration —, Olympiades annuelles).'),
(9,'J’ai fait des commentaires','Apprécier les commentaires en les utilisant pour lui présenter les activités de l’église (voir les directives de la décision 8). L’encourager à suivre le thème en cours d’enseignement.'),
(10,'Comment intégrer Vases d’Honneur','Intégrer l’église commence par remplir la fiche d’identification, participer aux cultes, intégrer une tribu, une famille d’honneur et servir dans un département. N.B. : être baptisé par immersion et faire le prochain cours de membres (cours d’explication de la vision et de l’organisation de l’église) pour servir dans un département.'),
(11,'Comment faire partie des familles d’honneur','En attente de la création des familles d’honneur de Niangon ou celles déjà créées par le Centre Yopougon ou se trouvant à Niangon.'),
(12,'J’ai besoin de prières','Prier avec lui selon ses sujets et l’orienter au… [Fin de la directive non visible sur la capture : à compléter.]');
CREATE TABLE schema_migrations (filename VARCHAR(255) PRIMARY KEY,checksum CHAR(64) NOT NULL,executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO schema_migrations (filename,checksum) VALUES ('002-kiosk-tours.sql','557ea6c94f88f01dc9e9188929966e9b8ec887d3beeb752030adaf6a8921fd15');
INSERT INTO schema_migrations (filename,checksum) VALUES ('003-location-donations.sql','835040ee57215da498022323655e13e0d8c2640fce9224bd43470e6156fd6dba');
INSERT INTO schema_migrations (filename,checksum) VALUES ('004-members-groups.sql','efa2b39a2469f7a3c1b5fad9cc51f215ad438be9a954f4cc1f9841c5bebf2030');
