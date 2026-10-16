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
