-- Behandlingsområden i databasen så de kan redigeras, läggas till och tas bort
-- från adminsidan. Ersätter de hårdkodade listorna (och tar över ml + av/på).
CREATE TABLE IF NOT EXISTS treatment_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,          -- 'fillers' | 'toxin'
  name TEXT NOT NULL,
  ml INTEGER,                       -- fillers: uppskattad ml; rynkbehandling: NULL
  sort INTEGER NOT NULL DEFAULT 0,
  disabled INTEGER NOT NULL DEFAULT 0
);

-- Seed en gång (bara om tabellen är tom).
INSERT INTO treatment_areas (category, name, ml, sort, disabled)
SELECT category, name, ml, sort, disabled FROM (
  SELECT 'fillers' AS category, 'Läppar' AS name, 1 AS ml, 0 AS sort, 0 AS disabled
  UNION ALL SELECT 'fillers', 'Kindben', 2, 1, 0
  UNION ALL SELECT 'fillers', 'Nasolabialveck', 1, 2, 0
  UNION ALL SELECT 'fillers', 'Marionettlinjer', 1, 3, 0
  UNION ALL SELECT 'fillers', 'Käklinje', 3, 4, 0
  UNION ALL SELECT 'fillers', 'Haka', 1, 5, 0
  UNION ALL SELECT 'fillers', 'Tear troughs (mörka ringar under ögonen)', 1, 6, 0
  UNION ALL SELECT 'toxin', 'Glabella (”arg-rynkan” mellan ögonbrynen)', NULL, 0, 0
  UNION ALL SELECT 'toxin', 'Sura mungipor (marionettlinjer)', NULL, 1, 0
  UNION ALL SELECT 'toxin', 'Nästox (avsmalning eller uppnäsa)', NULL, 2, 0
  UNION ALL SELECT 'toxin', 'Panna och lätt ögonbrynslyft', NULL, 3, 0
  UNION ALL SELECT 'toxin', 'Apelsinhaka och spända hakmuskler', NULL, 4, 0
  UNION ALL SELECT 'toxin', 'Käkförminskning', NULL, 5, 0
  UNION ALL SELECT 'toxin', 'Lipflip (form på överläppen)', NULL, 6, 0
  UNION ALL SELECT 'toxin', 'Traptox / Barbietox', NULL, 7, 0
  UNION ALL SELECT 'toxin', 'Nefertiti-halslyft', NULL, 8, 0
  UNION ALL SELECT 'toxin', 'Vader (smalare intryck)', NULL, 9, 0
)
WHERE NOT EXISTS (SELECT 1 FROM treatment_areas);

-- Ta över eventuella tidigare justerade ml-vikter.
UPDATE treatment_areas
SET ml = (SELECT ml FROM area_ml WHERE area_ml.area = treatment_areas.name)
WHERE category = 'fillers'
  AND name IN (SELECT area FROM area_ml);
