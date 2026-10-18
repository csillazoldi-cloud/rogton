-- 0165: R-18 3. kör (Csilla 2026-10-11, „ez legyen az utolsó kör”): a régi terméknév („Kommunikációs munkatér” / „Spațiu de (lucru de)
-- comunicare” / „Communication workspace”) utolsó felirat-előfordulásai a termék nevére (Posztgyár / Fabrica de postări / Post factory).
-- A helyi adatbázison (0001–0164 után) a régi névre illeszkedő ÖSSZES felirat: ez az 5 kulcs × 3 nyelv = 15 sor; plusz a belépő lap címe
-- („Lépj be a munkatérbe.” / „Sign in to your workspace.” — a termék neve állt ott, nem a fogalom): belepes.cim_kiemelt × 3 + belepes.cim_eleje EN = 4 sor. A „munkatér” mint fogalom
-- (az ügyfél munkatere: „Kilépek a munkatérből”, „Munkatér: {munkater}”) NEM terméknév — marad. Az „Aitmetica SRL” jogi név — marad.
-- ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: INSERT 0 19, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0165_r18_regi_nev_vege.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kozos.app_nev', 'hu', 'Posztgyár'),
  ('kozos.app_nev', 'ro', 'Fabrica de postări'),
  ('kozos.app_nev', 'en', 'Post factory'),
  ('nyitolap.termeknev', 'hu', 'Posztgyár'),
  ('nyitolap.termeknev', 'ro', 'Fabrica de postări'),
  ('nyitolap.termeknev', 'en', 'Post factory'),
  ('koltseg.munkater', 'hu', 'Posztgyár'),
  ('koltseg.munkater', 'ro', 'Fabrica de postări'),
  ('koltseg.munkater', 'en', 'Post factory'),
  ('kezdolap.sor', 'hu', 'Posztgyár · {verzio} · teszt'),
  ('kezdolap.sor', 'ro', 'Fabrica de postări · {verzio} · test'),
  ('kezdolap.sor', 'en', 'Post factory · {verzio} · test'),
  ('r17.level.bevezeto', 'hu', 'Új logótervezési kérés érkezett a Posztgyárból.'),
  ('r17.level.bevezeto', 'ro', 'A sosit o cerere nouă de proiectare logo din Fabrica de postări.'),
  ('r17.level.bevezeto', 'en', 'A new logo design request arrived from Post factory.'),
  ('belepes.cim_kiemelt', 'hu', 'Posztgyárba.'),
  ('belepes.cim_kiemelt', 'ro', 'Fabrica de postări.'),
  ('belepes.cim_kiemelt', 'en', 'Post factory.'),
  ('belepes.cim_eleje', 'en', 'Sign in to')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
