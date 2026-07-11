CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  namn TEXT NOT NULL,
  epost TEXT NOT NULL,
  telefon TEXT,
  omrade TEXT,
  meddelande TEXT
);
