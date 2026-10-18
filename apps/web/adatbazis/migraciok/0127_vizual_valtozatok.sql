-- 0127: VZ-3 — a Képek színváltozatai. A munkatér megjegyzi a legutóbb választott változatot (a következő kép és a kártyák
-- alapja, ha azon a képen megmarad), és a választó feliratai (design/vz3/feliratok.json, hu · ro · en).
ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "kep_valtozat" text DEFAULT 'vilagos' NOT NULL;
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vz3.szinek', 'hu', 'Színek'), ('vz3.szinek', 'ro', 'Culori'), ('vz3.szinek', 'en', 'Colours'),
  ('vz3.vilagos', 'hu', 'Világos'), ('vz3.vilagos', 'ro', 'Deschis'), ('vz3.vilagos', 'en', 'Light'),
  ('vz3.szines', 'hu', 'Színes'), ('vz3.szines', 'ro', 'Colorat'), ('vz3.szines', 'en', 'Colourful'),
  ('vz3.sotet', 'hu', 'Sötét'), ('vz3.sotet', 'ro', 'Închis'), ('vz3.sotet', 'en', 'Dark'),
  ('vz3.masik_szin', 'hu', 'Másik szín'), ('vz3.masik_szin', 'ro', 'Altă culoare'), ('vz3.masik_szin', 'en', 'Other colour'),
  ('vz3.atmenet', 'hu', 'Átmenet'), ('vz3.atmenet', 'ro', 'Degradé'), ('vz3.atmenet', 'en', 'Gradient')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
