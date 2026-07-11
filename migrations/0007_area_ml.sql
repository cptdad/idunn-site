CREATE TABLE IF NOT EXISTS area_ml (
  area TEXT PRIMARY KEY,
  ml INTEGER NOT NULL
);

INSERT OR IGNORE INTO area_ml (area, ml) VALUES
  ('Läppar', 1),
  ('Kindben', 2),
  ('Nasolabialveck', 1),
  ('Marionettlinjer', 1),
  ('Käklinje', 3),
  ('Haka', 1),
  ('Tear troughs (mörka ringar under ögonen)', 1);
