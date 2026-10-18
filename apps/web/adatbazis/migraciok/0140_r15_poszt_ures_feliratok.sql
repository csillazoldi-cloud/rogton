-- 0140: R-15 · 08 Posztszöveg — az ÜRES lap (nincs váró és nincs kész poszt) címe és alcíme. Tibor-bíráló/kirakás-zár 09-30:
-- a friss fiókon a lap „Vár rád · 0 / Kész · 0” volt egy halk linkkel, fő gomb nélkül (T1, T2 piros). Mostantól: egy kérdés
-- (≤ 6 szó), egy mondat, és a „Saját ötletből” a lap egyetlen fő gombja. Csilla döntése 09-30 (rajz nélkül; a kezdőlap üres állapota
-- külön Design-kérés, c5).
-- CSAK feliratok (2 kulcs × hu/ro/en = 6 sor). Tábla, oszlop, adat nem változik. ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 6, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0140_r15_poszt_ures_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.poszt.ures_kerdes', 'hu', 'Miről posztolunk?'),
  ('r15.poszt.ures_kerdes', 'ro', 'Despre ce postăm?'),
  ('r15.poszt.ures_kerdes', 'en', 'What shall we post about?'),
  ('r15.poszt.ures_alcim', 'hu', 'Ha jön hír, mi megírjuk. Addig a saját ötletedből.'),
  ('r15.poszt.ures_alcim', 'ro', 'Când apare o știre, o scriem noi. Până atunci, din ideea ta.'),
  ('r15.poszt.ures_alcim', 'en', 'When news comes in, we write it. Until then, from your own idea.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
