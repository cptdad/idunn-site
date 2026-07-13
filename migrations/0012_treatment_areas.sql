-- Behandlingsområden i databasen så de kan redigeras, läggas till och tas bort
-- från adminsidan. Ersätter de hårdkodade listorna (och tar över ml + av/på).
CREATE TABLE IF NOT EXISTS treatment_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,          -- 'fillers' | 'toxin'
  name TEXT NOT NULL,
  ml INTEGER,                       -- fillers: uppskattad ml; rynkbehandling: NULL
  sort INTEGER NOT NULL DEFAULT 0,
  disabled INTEGER NOT NULL DEFAULT 0,
  UNIQUE (category, name)
);

-- Seed (INSERT OR IGNORE gör det säkert att köra om).
INSERT OR IGNORE INTO treatment_areas (category, name, ml, sort, disabled) VALUES
  ('fillers', 'Läppar', 1, 0, 0),
  ('fillers', 'Kindben', 2, 1, 0),
  ('fillers', 'Nasolabialveck', 1, 2, 0),
  ('fillers', 'Marionettlinjer', 1, 3, 0),
  ('fillers', 'Käklinje', 3, 4, 0),
  ('fillers', 'Haka', 1, 5, 0),
  ('fillers', 'Tear troughs (mörka ringar under ögonen)', 1, 6, 0),
  ('toxin', 'Glabella (”arg-rynkan” mellan ögonbrynen)', NULL, 0, 0),
  ('toxin', 'Sura mungipor (marionettlinjer)', NULL, 1, 0),
  ('toxin', 'Nästox (avsmalning eller uppnäsa)', NULL, 2, 0),
  ('toxin', 'Panna och lätt ögonbrynslyft', NULL, 3, 0),
  ('toxin', 'Apelsinhaka och spända hakmuskler', NULL, 4, 0),
  ('toxin', 'Käkförminskning', NULL, 5, 0),
  ('toxin', 'Lipflip (form på överläppen)', NULL, 6, 0),
  ('toxin', 'Traptox / Barbietox', NULL, 7, 0),
  ('toxin', 'Nefertiti-halslyft', NULL, 8, 0),
  ('toxin', 'Vader (smalare intryck)', NULL, 9, 0);

-- Ta över eventuella tidigare justerade ml-vikter.
UPDATE treatment_areas
SET ml = (SELECT ml FROM area_ml WHERE area_ml.area = treatment_areas.name)
WHERE category = 'fillers'
  AND name IN (SELECT area FROM area_ml);
