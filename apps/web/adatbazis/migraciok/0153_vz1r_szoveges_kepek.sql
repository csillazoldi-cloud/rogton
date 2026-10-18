-- 0153: VZ-1 · a „Közlemények” név helyett „Szöveges képek” (Csilla 2026-10-06 18:15: a „Közlemények” túl hivatalos; design/VZ1-szerkeszto
-- kerdesek 1). CSAK feliratok: a 0151 négy kulcsának új szövege, hu/ro/en (a 0151 nem változik — a történet tiszta marad):
--   vz1r.kozlemenyek (a Képek sora, a lap címe, a szerkesztő vissza-linkje) · vz1r.sorszam (a kép száma) · a rendszergazda listájának két mondata.
-- ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 12, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0153_vz1r_szoveges_kepek.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vz1r.kozlemenyek', 'hu', 'Szöveges képek'),
  ('vz1r.kozlemenyek', 'ro', 'Imagini cu text'),
  ('vz1r.kozlemenyek', 'en', 'Text images'),
  ('vz1r.sorszam', 'hu', 'A kép száma'),
  ('vz1r.sorszam', 'ro', 'Numărul imaginii'),
  ('vz1r.sorszam', 'en', 'Image number'),
  ('vz1r.admin_jelzesek_kov', 'hu', 'A szöveges képek letöltésekor talált szabálysértések. A munkatárs ezeket nem látja.'),
  ('vz1r.admin_jelzesek_kov', 'ro', 'Încălcările de reguli găsite la descărcarea imaginilor cu text. Colegii nu le văd.'),
  ('vz1r.admin_jelzesek_kov', 'en', 'Rule violations found when text images were downloaded. Team members don''t see them.'),
  ('vz1r.admin_lista_alcim', 'hu', 'A letöltött szöveges képek jelzései, a legutóbbi elöl.'),
  ('vz1r.admin_lista_alcim', 'ro', 'Semnalările imaginilor cu text descărcate, cele mai noi primele.'),
  ('vz1r.admin_lista_alcim', 'en', 'Warnings of downloaded text images, newest first.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
