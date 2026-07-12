-- Områden som tillfälligt är avstängda (visas inte på bokningssidan).
-- Ett område som INTE finns i tabellen är tillgängligt (standard = allt på).
CREATE TABLE IF NOT EXISTS disabled_areas (
  area TEXT PRIMARY KEY
);
