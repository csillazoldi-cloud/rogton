-- 0168: Kati 10-11 esti visszajelzései (R-18 utókör) — feliratok, HU/RO/EN:
--   · r15.poszt.illik_iranytu: „Illik a cég iránytűjéhez” → „✓ Illik a céged irányához” (Kati: „kérdés, vagy állítás, hogy a szöveg rendben?”)
--   · r18.poszt.kimasoltuk: a „Kész, másolom” gomb a kimásolás után („✓ Kimásoltuk”) — a lap a poszton marad
--   · r18.elo.*: az „Így fog kinézni” makett eddig beégetett magyar szavai (Nyilvános, Tetszik, Hozzászólás, Megosztás, Újraküldés, Küldés)
-- ON CONFLICT: ismételhető. Szervezeti felülírást nem érint.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: INSERT 0 24, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0168_r18_kati_1011_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.poszt.illik_iranytu', 'hu', '✓ Illik a céged irányához'),
  ('r15.poszt.illik_iranytu', 'ro', '✓ Se potrivește cu direcția firmei tale'),
  ('r15.poszt.illik_iranytu', 'en', '✓ Fits your company''s direction'),
  ('r18.poszt.kimasoltuk', 'hu', '✓ Kimásoltuk'),
  ('r18.poszt.kimasoltuk', 'ro', '✓ Am copiat'),
  ('r18.poszt.kimasoltuk', 'en', '✓ Copied'),
  ('r18.elo.nyilvanos', 'hu', 'Nyilvános'),
  ('r18.elo.nyilvanos', 'ro', 'Public'),
  ('r18.elo.nyilvanos', 'en', 'Public'),
  ('r18.elo.tetszik', 'hu', 'Tetszik'),
  ('r18.elo.tetszik', 'ro', 'Îmi place'),
  ('r18.elo.tetszik', 'en', 'Like'),
  ('r18.elo.hozzaszolas', 'hu', 'Hozzászólás'),
  ('r18.elo.hozzaszolas', 'ro', 'Comentează'),
  ('r18.elo.hozzaszolas', 'en', 'Comment'),
  ('r18.elo.megosztas', 'hu', 'Megosztás'),
  ('r18.elo.megosztas', 'ro', 'Distribuie'),
  ('r18.elo.megosztas', 'en', 'Share'),
  ('r18.elo.ujrakuldes', 'hu', 'Újraküldés'),
  ('r18.elo.ujrakuldes', 'ro', 'Repostează'),
  ('r18.elo.ujrakuldes', 'en', 'Repost'),
  ('r18.elo.kuldes', 'hu', 'Küldés'),
  ('r18.elo.kuldes', 'ro', 'Trimite'),
  ('r18.elo.kuldes', 'en', 'Send')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
