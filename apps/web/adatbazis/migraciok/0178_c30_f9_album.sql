-- 0178: c30 F9 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.5, §6 „Limits”, §10 F9; döntés: docs/decisions/2026-10-17-c30-f9-album-tar.md).
--   1. Index az `arculat_fajl (szervezet_id, cel)`-re: az album kvótája (500 MB) és sebességkorlátja (60 fotó / 10 perc) minden
--      feltöltésnél összead a munkatér `cel = 'album'` soraiból. A tervben 0176 volt; a 0176 és a 0177 már a NAS-on van, nem írjuk át.
--   2. A három új hibakód felirata HU/RO/EN (packages/contracts HibaKod). A „Megtelt a fotótár …” mondat a terv §6 szövege.
--   Tábla, oszlop, jog nem változik (a `cel` `text NOT NULL`, CHECK nélkül — 0049). Meglévő sorhoz nem nyúl. Ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: CREATE INDEX, INSERT 0 9, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0178_c30_f9_album.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

CREATE INDEX IF NOT EXISTS "arculat_fajl_szervezet_cel" ON "arculat_fajl" ("szervezet_id", "cel");

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hiba.ALBUM_MEGTELT', 'hu', 'Megtelt a fotótár — a régi albumok fotóit töröld a Fájlok közül'),
  ('hiba.ALBUM_MEGTELT', 'ro', 'Spațiul pentru fotografii s-a umplut — șterge fotografiile albumelor vechi din Fișiere'),
  ('hiba.ALBUM_MEGTELT', 'en', 'The photo storage is full — delete the photos of old albums under Files'),
  ('hiba.ALBUM_TELE', 'hu', 'Egy albumba legfeljebb 40 fotó fér.'),
  ('hiba.ALBUM_TELE', 'ro', 'Într-un album încap cel mult 40 de fotografii.'),
  ('hiba.ALBUM_TELE', 'en', 'An album holds at most 40 photos.'),
  ('hiba.TUL_SOK_FELTOLTES', 'hu', 'Most sok fotó jött egyszerre. Várj pár percet, és megy tovább.'),
  ('hiba.TUL_SOK_FELTOLTES', 'ro', 'Au venit multe fotografii deodată. Așteaptă câteva minute și continuăm.'),
  ('hiba.TUL_SOK_FELTOLTES', 'en', 'Lots of photos arrived at once. Wait a few minutes and it carries on.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
