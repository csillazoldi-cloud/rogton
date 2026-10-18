-- 0147: tesztelői visszajelzések, 2026-10-06 kör (triage + Csilla döntései 10-06, DONTESEK-1006.md). CSAK feliratok: tábla, oszlop, adat nem
-- változik. Meglévő kulcsok szövege cserél (ON CONFLICT DO UPDATE) — egyik kulcs sem új. Ismételhető. 8 kulcs, 22 sor:
--   #4/H4 (Kati 10-02, 10-05)  r16.arculat.fajlok          „Fájlok” → „Minták, kézikönyv” (megmondja, mi van mögötte)
--   #7    (Kati 10-02)          r16.arculat.betu.kerdes     → „Milyen betűtípus illik hozzátok?” (a ro/en már így szól: csak hu)
--   #8    (Kati 10-02)          r16.arculat.betu.licenc     → „Csak olyan betűt tölts fel, amit szabad használnod.” (ro/en párhuzamosan)
--   #9    (Kati 10-02)          r16.arculat.betu.sajat_tipus a meglévő súgóba kerül az „egyszerre több is” (új látható mondat nincs)
--   #12   (Kati 10-02)          r16.arculat.logok.melyik_hova „Melyik hova?” → „Melyik logó hova kerül?”
--   #16   (Kati 10-01)          r16.arculat.logok.negyzetes „Négyzetes” → „Profilképnek”; a „Melyik logó hova kerül?” magyarázata is
--                               (r16.arculat.logok.melyik_hova_szoveg) az új névvel szól
--   #24   (Kamilla 09-16)       onboarding.eb_oldalak       „Mely oldalakat figyeljük” → „Mely híroldalakat figyeljük”
-- A #6 („A négy helyre mi tesszük.”) nem felirat-csere: a kulcs marad az adatbázisban (nem törlünk), csak a lap nem mutatja.
-- A design/R16-arculat/feliratok.json a rajz kori szöveget őrzi; a rajz frissítése a Design-kör dolga (ez a migráció a hiteles).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 22, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0147_visszajelzes_1006_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r16.arculat.fajlok', 'hu', 'Minták, kézikönyv'),
  ('r16.arculat.fajlok', 'ro', 'Mostre, manual'),
  ('r16.arculat.fajlok', 'en', 'Samples, brand book'),
  ('r16.arculat.betu.kerdes', 'hu', 'Milyen betűtípus illik hozzátok?'),
  ('r16.arculat.betu.licenc', 'hu', 'Csak olyan betűt tölts fel, amit szabad használnod.'),
  ('r16.arculat.betu.licenc', 'ro', 'Încarcă doar fonturi pe care ai voie să le folosești.'),
  ('r16.arculat.betu.licenc', 'en', 'Only upload fonts you are allowed to use.'),
  ('r16.arculat.betu.sajat_tipus', 'hu', 'TTF, OTF vagy WOFF2 fájl — egyszerre több is'),
  ('r16.arculat.betu.sajat_tipus', 'ro', 'Fișier TTF, OTF sau WOFF2 — chiar mai multe deodată'),
  ('r16.arculat.betu.sajat_tipus', 'en', 'A TTF, OTF or WOFF2 file — several at once'),
  ('r16.arculat.logok.melyik_hova', 'hu', 'Melyik logó hova kerül?'),
  ('r16.arculat.logok.melyik_hova', 'ro', 'Ce logo unde ajunge?'),
  ('r16.arculat.logok.melyik_hova', 'en', 'Which logo goes where?'),
  ('r16.arculat.logok.negyzetes', 'hu', 'Profilképnek'),
  ('r16.arculat.logok.negyzetes', 'ro', 'Pentru poza de profil'),
  ('r16.arculat.logok.negyzetes', 'en', 'For profile pictures'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'hu', 'Világos háttérre: a krém és fehér képekre. Sötét háttérre: a színes és sötét képekre. Egy színnel: ha a kép zsúfolt. Profilképnek: a kis, négyzetes helyekre. Ami hiányzik, arra a legközelebbit tesszük.'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'ro', 'Pentru fundal deschis: imaginile crem și albe. Pentru fundal închis: imaginile colorate și închise. Într-o singură culoare: când imaginea e aglomerată. Pentru poza de profil: locurile mici, pătrate. Unde lipsește unul, punem cel mai apropiat.'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'en', 'For light backgrounds: cream and white images. For dark backgrounds: coloured and dark images. Single colour: when the image is busy. For profile pictures: small, square spaces. Where one is missing, we use the closest.'),
  ('onboarding.eb_oldalak', 'hu', 'Mely híroldalakat figyeljük'),
  ('onboarding.eb_oldalak', 'ro', 'Ce site-uri de știri urmărim'),
  ('onboarding.eb_oldalak', 'en', 'Which news sites we watch')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
