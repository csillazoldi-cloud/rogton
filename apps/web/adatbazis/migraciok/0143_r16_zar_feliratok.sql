-- 0143: kirakás-zár javítás (10-01 22:07, a bíráló 3/3 futáson piros, pont 4: arculat-mas-szin / asztali). Csilla: jóváhagyva.
-- A 12d2 „Más színt” címe alá egy halk sor kerül: hol látszik ez a szín a posztképeken (a bíráló szó szerint: „második szín
-- (a második micsoda?)”, „mit színez pontosan”). Fülenként egy kulcs (fő · második · háttér), a cím is fülenként vált.
-- A szövegek betűre a design/R16-arculat/feliratok.json-ból (hu/ro/en). CSAK feliratok: tábla, oszlop, adat nem változik.
-- 3 új kulcs × 3 nyelv = 9 sor. A névlogó lap (12g) asztali címe NEM itt változik: a kód a már jóváhagyott 12a telefonos kulcsokat
-- (r16.arculat.nevlogo.kerdes / .alcim, 0142) használja — egy dolog, egy szöveg, egy kulcs.
-- ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 9, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0143_r16_zar_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r16.arculat.szin.hol_fo', 'hu', 'A képeiden a címkék és sávok színe.'),
  ('r16.arculat.szin.hol_fo', 'ro', 'Culoarea etichetelor și a benzilor de pe imaginile tale.'),
  ('r16.arculat.szin.hol_fo', 'en', 'The colour of the labels and bands on your images.'),
  ('r16.arculat.szin.hol_masodik', 'hu', 'A színes képeiden ezzel emeljük ki a címkét.'),
  ('r16.arculat.szin.hol_masodik', 'ro', 'Pe imaginile tale colorate, cu ea evidențiem eticheta.'),
  ('r16.arculat.szin.hol_masodik', 'en', 'On your coloured images, this makes the label stand out.'),
  ('r16.arculat.szin.hol_hatter', 'hu', 'A képeid világos alapja, a szöveg mögött.'),
  ('r16.arculat.szin.hol_hatter', 'ro', 'Fondul deschis al imaginilor tale, în spatele textului.'),
  ('r16.arculat.szin.hol_hatter', 'en', 'The light base of your images, behind the text.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
