CREATE TABLE IF NOT EXISTS prices (
  slug TEXT PRIMARY KEY,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Marknadsmässiga startpriser (kr) – ändras i admin.
INSERT OR IGNORE INTO prices (slug, amount) VALUES
  ('rynkbehandling', 1900),
  ('harmonisering', 3500),
  ('hudvard', 1500),
  ('konsultation', 0);

-- Belopp som debiterats (kr) för bokningen
ALTER TABLE bookings ADD COLUMN amount INTEGER;
