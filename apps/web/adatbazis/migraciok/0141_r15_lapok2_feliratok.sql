-- 0141: R-15 · 3. szállítmány (design/R15/rajz/R15-lapok-2.dc.html — 03a · 03b · 03c · 04a · 04b; gepezet-2, kerdesek-2).
-- A szövegek betűre a design/R15/feliratok-2.json-ból (hu/ro/en). CSAK feliratok: tábla, oszlop, adat nem változik.
-- Két rész:
--   1. MEGLÉVŐ kulcsok ÚJ értéke (kerdesek-2 10, Csilla 10-01): az öt „…atnezem…” kulcs „Megnézem…” alakra
--      (a 0131-ben „Átnézem…” volt), és a r15.kezdolap.alcim rövidebben („{n} hírből már megírtuk.” — a nyugtató sor így
--      fér bele a 60 szavas keretbe). 6 kulcs × 3 nyelv = 18 sor. A 0131 nem módosul (lefutott migrációt nem írunk át).
--   2. ÚJ kulcsok: 20 kulcs × 3 nyelv = 60 sor.
-- A „Ma nincs dolgod” (r15.kezdolap.kerdes_nulla) képernyő-állapot nyugdíjban (kerdesek-2 1), a kulcs marad. A „Napi hírfigyelés”
-- (r15.kezdolap.napi_figyeles) sor új néven: r15.kozos.napi_hirek_sor (kerdesek-2 4); a régi kulcs marad.
-- ON CONFLICT: ismételhető, és ha egy kulcs mégis hiányozna, létrejön.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 18, INSERT 0 60, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0141_r15_lapok2_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

-- 1. Meglévő kulcsok, új érték (kerdesek-2 10)
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kezdolap.atnezem_posztot', 'hu', 'Megnézem a posztot'),
  ('r15.kezdolap.atnezem_posztot', 'ro', 'Văd postarea'),
  ('r15.kezdolap.atnezem_posztot', 'en', 'See the post'),
  ('r15.kezdolap.atnezem', 'hu', 'Megnézem'),
  ('r15.kezdolap.atnezem', 'ro', 'Văd'),
  ('r15.kezdolap.atnezem', 'en', 'See'),
  ('r15.hirek.atnezem_posztot', 'hu', 'Megnézem a posztot'),
  ('r15.hirek.atnezem_posztot', 'ro', 'Văd postarea'),
  ('r15.hirek.atnezem_posztot', 'en', 'See the post'),
  ('r15.hirek.atnezem', 'hu', 'Megnézem'),
  ('r15.hirek.atnezem', 'ro', 'Văd'),
  ('r15.hirek.atnezem', 'en', 'See'),
  ('r15.hirek.atnezem_elsot', 'hu', 'Megnézem az elsőt'),
  ('r15.hirek.atnezem_elsot', 'ro', 'Văd prima'),
  ('r15.hirek.atnezem_elsot', 'en', 'See the first'),
  ('r15.kezdolap.alcim', 'hu', '{n} hírből már megírtuk.'),
  ('r15.kezdolap.alcim', 'ro', 'Am scris deja din {n} știri.'),
  ('r15.kezdolap.alcim', 'en', 'Already written from {n} news items.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- 2. Új kulcsok (R15-lapok-2)
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kezdolap.elso_kerdes', 'hu', 'Kész az első posztod'),
  ('r15.kezdolap.elso_kerdes', 'ro', 'Prima ta postare e gata'),
  ('r15.kezdolap.elso_kerdes', 'en', 'Your first post is ready'),
  ('r15.kezdolap.elso_alcim', 'hu', 'A cégetek adataiból írtuk.'),
  ('r15.kezdolap.elso_alcim', 'ro', 'Am scris-o din datele firmei voastre.'),
  ('r15.kezdolap.elso_alcim', 'en', 'We wrote it from your company details.'),
  ('r15.kezdolap.bemutatkozo', 'hu', 'Bemutatkozó poszt'),
  ('r15.kezdolap.bemutatkozo', 'ro', 'Postare de prezentare'),
  ('r15.kezdolap.bemutatkozo', 'en', 'Introduction post'),
  ('r15.kezdolap.kesz_kerdes', 'hu', 'Mára kész vagy'),
  ('r15.kezdolap.kesz_kerdes', 'ro', 'Ai terminat pe azi'),
  ('r15.kezdolap.kesz_kerdes', 'en', 'You''re done for today'),
  ('r15.kezdolap.kesz_alcim', 'hu', 'Holnap reggel hozzuk a következő híreket.'),
  ('r15.kezdolap.kesz_alcim', 'ro', 'Mâine dimineață aducem știrile următoare.'),
  ('r15.kezdolap.kesz_alcim', 'en', 'We''ll bring the next news tomorrow morning.'),
  ('r15.kozos.halad_elso', 'hu', 'Ezen a héten: ez lesz az első.'),
  ('r15.kozos.halad_elso', 'ro', 'Săptămâna aceasta: aceasta va fi prima.'),
  ('r15.kozos.halad_elso', 'en', 'This week: this will be your first.'),
  ('r15.kozos.szep_munka', 'hu', 'Szép munka!'),
  ('r15.kozos.szep_munka', 'ro', 'Bravo!'),
  ('r15.kozos.szep_munka', 'en', 'Nice work!'),
  ('r15.kozos.napi_hirek_sor', 'hu', 'Friss hírek minden reggel'),
  ('r15.kozos.napi_hirek_sor', 'ro', 'Știri proaspete în fiecare dimineață'),
  ('r15.kozos.napi_hirek_sor', 'en', 'Fresh news every morning'),
  ('r15.kozos.munkad_cim', 'hu', 'Mutasd meg a legutóbbi munkádat'),
  ('r15.kozos.munkad_cim', 'ro', 'Arată-ți ultima lucrare'),
  ('r15.kozos.munkad_cim', 'en', 'Show your latest work'),
  ('r15.kozos.foto_munka', 'hu', 'Egy fotó egy kész munkáról — a szöveget mi írjuk rá.'),
  ('r15.kozos.foto_munka', 'ro', 'O fotografie cu o lucrare terminată — textul îl scriem noi.'),
  ('r15.kozos.foto_munka', 'en', 'One photo of a finished job — we write the text on it.'),
  ('r15.kozos.kepet_keszitek_munka', 'hu', 'Képet készítek a munkámról'),
  ('r15.kozos.kepet_keszitek_munka', 'ro', 'Fac o imagine cu lucrarea mea'),
  ('r15.kozos.kepet_keszitek_munka', 'en', 'Make an image of my work'),
  ('r15.kozos.kep_minta_alt', 'hu', 'Minta: így néz ki a képed — kész udvar, rajta a cég neve'),
  ('r15.kozos.kep_minta_alt', 'ro', 'Exemplu: așa arată imaginea ta — o curte terminată, cu numele firmei'),
  ('r15.kozos.kep_minta_alt', 'en', 'Sample: this is how your image looks — a finished yard with your company name'),
  ('r15.hirek.ures_kerdes', 'hu', 'Ma nincs új hír nektek'),
  ('r15.hirek.ures_kerdes', 'ro', 'Azi nu sunt știri noi pentru voi'),
  ('r15.hirek.ures_kerdes', 'en', 'No new news for you today'),
  ('r15.hirek.legutobb_rovid', 'hu', 'Legutóbb {mikor} kerestünk.'),
  ('r15.hirek.legutobb_rovid', 'ro', 'Ultima dată am căutat {mikor}.'),
  ('r15.hirek.legutobb_rovid', 'en', 'We last looked {mikor}.'),
  ('r15.hirek.ures_ajanlat', 'hu', 'Addig mutasd meg a legutóbbi munkádat'),
  ('r15.hirek.ures_ajanlat', 'ro', 'Între timp, arată-ți ultima lucrare'),
  ('r15.hirek.ures_ajanlat', 'en', 'Meanwhile, show your latest work'),
  ('r15.hirek.elso_kerdes', 'hu', 'Keressük az első híreiteket'),
  ('r15.hirek.elso_kerdes', 'ro', 'Căutăm primele voastre știri'),
  ('r15.hirek.elso_kerdes', 'en', 'We''re looking for your first news'),
  ('r15.hirek.holnap_ujra', 'hu', 'Holnap reggel újra nézzük.'),
  ('r15.hirek.holnap_ujra', 'ro', 'Mâine dimineață căutăm din nou.'),
  ('r15.hirek.holnap_ujra', 'en', 'We''ll look again tomorrow morning.'),
  ('r15.hirek.posztod', 'hu', 'Posztod: {otlet}'),
  ('r15.hirek.posztod', 'ro', 'Postarea ta: {otlet}'),
  ('r15.hirek.posztod', 'en', 'Your post: {otlet}'),
  ('r15.kezdolap.kesz_ajanlat', 'hu', 'Ha van kedved: még egy kép a munkádról.'),
  ('r15.kezdolap.kesz_ajanlat', 'ro', 'Dacă ai chef: încă o imagine cu lucrarea ta.'),
  ('r15.kezdolap.kesz_ajanlat', 'en', 'If you feel like it: one more image of your work.'),
  ('r15.kozos.nyugtato', 'hu', 'Átírhatod, és csak te teszed ki.'),
  ('r15.kozos.nyugtato', 'ro', 'O poți rescrie și doar tu o publici.'),
  ('r15.kozos.nyugtato', 'en', 'You can rewrite it, and only you post it.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
