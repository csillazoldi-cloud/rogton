-- 0144: kirakás-zár javítás (10-02 05:54, a bíráló 3/3 futáson piros, pont 4·4·4: kezdolap / telefon, 03c2). Csilla: jóváhagyva.
-- A bíráló szó szerint: „Hová kell fotót tennem, nincs rajta feltöltés gomb” · „A szürke csíkos négyzet: ez betöltés, hiba vagy csak minta?”
-- A csíkos mintakép (MunkaMinta `fotoResz`, 03c2 és 04a) halk „Minta” jelet kap, a 03c2 képaláírása pedig megmondja, hol kérjük a fotót.
-- A szövegek betűre a design/R15/feliratok-4.json-ból (hu/ro/en). CSAK feliratok: tábla, oszlop, adat nem változik.
-- Két rész:
--   1. MEGLÉVŐ kulcs ÚJ értéke: r15.kozos.minta_sor („Így néz ki — a te fotóddal és a cégneveddel.” → „A fotódat a következő lépésben
--      kérjük.”). 1 kulcs × 3 nyelv = 3 sor. A 0142 nem módosul (lefutott migrációt nem írunk át); a feliratok-3.json a 0142 forrása marad.
--   2. ÚJ kulcs: r15.kozos.minta_jel („Minta”). 1 kulcs × 3 nyelv = 3 sor.
-- A szószám nem nő: 8 szó helyett 1 + 6 (a 03c2 telefon első képernyője).
-- ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0144_r15_minta_jel_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

-- 1. Meglévő kulcs, új érték
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kozos.minta_sor', 'hu', 'A fotódat a következő lépésben kérjük.'),
  ('r15.kozos.minta_sor', 'ro', 'Fotografia ți-o cerem la pasul următor.'),
  ('r15.kozos.minta_sor', 'en', 'We ask for your photo in the next step.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- 2. Új kulcs
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kozos.minta_jel', 'hu', 'Minta'),
  ('r15.kozos.minta_jel', 'ro', 'Exemplu'),
  ('r15.kozos.minta_jel', 'en', 'Sample')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
