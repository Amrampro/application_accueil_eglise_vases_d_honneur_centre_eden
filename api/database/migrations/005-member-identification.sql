-- L’identifiant public reste distinct de la clé primaire et de la clé anti-doublon.
ALTER TABLE members ADD COLUMN unique_identification CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NULL;
UPDATE members m
JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS sequence_number FROM members) numbered ON numbered.id=m.id
SET m.unique_identification=CAST(100000 + MOD(numbered.sequence_number * 7919 + 104729, 900000) AS CHAR);
ALTER TABLE members
  MODIFY unique_identification CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT '',
  ADD CONSTRAINT members_unique_identification UNIQUE (unique_identification),
  ADD CONSTRAINT members_identification_format CHECK (unique_identification REGEXP '^[1-9][0-9]{5}$');
CREATE TABLE member_identification_counter (
 id TINYINT UNSIGNED PRIMARY KEY,
 next_value INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO member_identification_counter (id,next_value) SELECT 1,COUNT(*)+1 FROM members;
-- Le verrou transactionnel du compteur garantit l’unicité même en cas d’inscriptions simultanées.
-- 7919 est premier avec 900000 : la permutation produit 900000 codes différents de six chiffres.
CREATE TRIGGER members_assign_identification BEFORE INSERT ON members FOR EACH ROW
BEGIN
  DECLARE sequence_number INT UNSIGNED;
  SELECT next_value INTO sequence_number FROM member_identification_counter WHERE id=1 FOR UPDATE;
  IF sequence_number > 900000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Tous les identifiants membre à six chiffres ont été attribués.';
  END IF;
  UPDATE member_identification_counter SET next_value=next_value+1 WHERE id=1;
  SET NEW.unique_identification=CAST(100000 + MOD(sequence_number * 7919 + 104729, 900000) AS CHAR);
END;
