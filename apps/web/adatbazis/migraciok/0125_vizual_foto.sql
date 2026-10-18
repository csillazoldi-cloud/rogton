-- 0125: VZ-2 — a fotó feliratai, amelyek a rajz feliratai között nem szerepeltek (Újdonság fotója, a nem kötelező fotó,
-- a kép-igazítás „húzd el” jele — a rajz képvázlatán szerepel: design/vz2/rajz/vz2-kep.js).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vz2.foto_uj', 'hu', 'Fotó az újdonságról'),
  ('vz2.foto_uj', 'ro', 'Fotografie cu noutatea'),
  ('vz2.foto_uj', 'en', 'Photo of what''s new'),
  ('vz2.foto_nem_kotelezo', 'hu', 'Fotó (nem kötelező)'),
  ('vz2.foto_nem_kotelezo', 'ro', 'Fotografie (opțională)'),
  ('vz2.foto_nem_kotelezo', 'en', 'Photo (optional)'),
  ('vz2.huzd_el', 'hu', 'húzd el'),
  ('vz2.huzd_el', 'ro', 'trage'),
  ('vz2.huzd_el', 'en', 'drag')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
