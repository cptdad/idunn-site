CREATE TABLE IF NOT EXISTS time_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  base INTEGER NOT NULL,
  per_ml INTEGER NOT NULL,
  per_area INTEGER NOT NULL
);

INSERT OR IGNORE INTO time_config (id, base, per_ml, per_area) VALUES (1, 15, 10, 5);
