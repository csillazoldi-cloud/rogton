-- 0139: R-16 K6 — a 12g „Készítsünk egyet?” és a „Nincs logóm” link feliratai (design/R16-arculat/TERV.md §2-K6, §2-K8; gepezet 13).
-- CSAK feliratok (5 kulcs × hu/ro/en = 15 sor, a design/R16-arculat/feliratok.json szövegével betűre). Tábla, oszlop, adat nem változik:
-- a névlogó fájljai a meglévő `arculat_fajl` táblába kerülnek (cel = 'logo', eredet = 'gep' — a 0135 CHECK-je ezt már engedi; a `tipus`
-- oszlopon nincs CHECK — mérve: 0049 —, így az új, csak gépi 'svg' típus is beírható), a stílus a tervezet `nevlogo_stilus` mezőjébe (K1).
-- A többi kulcs, amit a 12g használ (ez_legyen, megse), a 0136-ban van.
-- ON CONFLICT: ismételhető (a már futott migrációt soha nem írjuk át — a javítás új migráció).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 15, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0139_r16_nevlogo_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r16.arculat.nincs_logom', 'hu', 'Nincs logóm'),
  ('r16.arculat.nincs_logom', 'ro', 'Nu am logo'),
  ('r16.arculat.nincs_logom', 'en', 'I don''t have a logo'),
  ('r16.arculat.keszit.kerdes', 'hu', 'Készítsünk egyet?'),
  ('r16.arculat.keszit.kerdes', 'ro', 'Să facem unul?'),
  ('r16.arculat.keszit.kerdes', 'en', 'Shall we make one?'),
  ('r16.arculat.keszit.alcim', 'hu', 'A neved, a színeid és a betűd. Válassz egyet.'),
  ('r16.arculat.keszit.alcim', 'ro', 'Numele, culorile și fontul tău. Alege unul.'),
  ('r16.arculat.keszit.alcim', 'en', 'Your name, your colours and your font. Pick one.'),
  ('r16.arculat.keszit.negy_hely', 'hu', 'A négy helyre mi tesszük.'),
  ('r16.arculat.keszit.negy_hely', 'ro', 'Le punem noi în toate cele patru locuri.'),
  ('r16.arculat.keszit.negy_hely', 'en', 'We put it in all four places.'),
  ('r16.arculat.keszit.inkabb_feltoltom', 'hu', 'Inkább feltöltöm'),
  ('r16.arculat.keszit.inkabb_feltoltom', 'ro', 'Prefer să îl încarc'),
  ('r16.arculat.keszit.inkabb_feltoltom', 'en', 'I''d rather upload one')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
