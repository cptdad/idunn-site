CREATE TABLE IF NOT EXISTS pricing_tiers (
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  PRIMARY KEY (category, quantity)
);

INSERT OR IGNORE INTO pricing_tiers (category, quantity, amount) VALUES
  ('fillers', 1, 3200),
  ('fillers', 2, 5800),
  ('fillers', 3, 8200),
  ('fillers', 4, 10900),
  ('toxin', 1, 2500),
  ('toxin', 2, 3300),
  ('toxin', 3, 3850),
  ('toxin', 4, 4400);
