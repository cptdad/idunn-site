CREATE TABLE IF NOT EXISTS slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  datum TEXT NOT NULL,
  tid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (datum, tid)
);

ALTER TABLE bookings ADD COLUMN personnummer TEXT;
ALTER TABLE bookings ADD COLUMN adress TEXT;
ALTER TABLE bookings ADD COLUMN slot_id INTEGER;
ALTER TABLE bookings ADD COLUMN datum TEXT;
ALTER TABLE bookings ADD COLUMN tid TEXT;
