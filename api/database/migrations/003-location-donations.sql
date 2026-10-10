ALTER TABLE settings
  ADD COLUMN map_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN map_embed_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN donation_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN donation_qr_image TEXT NOT NULL DEFAULT '';
UPDATE settings SET church_name = 'Église Vases d''Honneur Centre Éden' WHERE id = 1;
