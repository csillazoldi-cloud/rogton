-- E-44: a nyitólap fotórétegeinek beállításai a Theme-lapon (Effektek szekció).
-- Három csúszka: mennyire látszik a fotó a hero mögött, mennyire a záró blokk mögött,
-- és mennyire sűrű a rájuk kerülő sötét fátyol. A fátyol öt fokozatát a designrendszer
-- számolja ebből az egy értékből (szarmaztat()), a lapba nem kerül színkeverés.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.foto_hero', 'hu', 'Fotó a lap tetején'),
  ('tema.foto_hero', 'ro', 'Fotografia din partea de sus'),
  ('tema.foto_hero', 'en', 'Photo at the top of the page'),
  ('tema.foto_zaro', 'hu', 'Fotó a záró blokkban'),
  ('tema.foto_zaro', 'ro', 'Fotografia din blocul final'),
  ('tema.foto_zaro', 'en', 'Photo in the closing block'),
  ('tema.fatyol', 'hu', 'Sötét fátyol a fotókon'),
  ('tema.fatyol', 'ro', 'Voal întunecat peste fotografii'),
  ('tema.fatyol', 'en', 'Dark veil over the photos'),
  ('tema.foto_jegyzet', 'hu', 'A nyitólap fotói a szöveg mögött vannak. A fátyol tartja olvashatóan a szöveget — ha ritkítod, a fotó jobban látszik, de a szöveg nehezebben olvasható.'),
  ('tema.foto_jegyzet', 'ro', 'Fotografiile paginii de start sunt în spatele textului. Voalul păstrează textul lizibil — dacă îl subțiezi, fotografia se vede mai bine, dar textul se citește mai greu.'),
  ('tema.foto_jegyzet', 'en', 'The landing page photos sit behind the text. The veil keeps the text readable — thin it out and the photo shows more, but the text gets harder to read.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- A tárolt KÖZÖS ALAP kiegészítése az azóta bevezetett tokenekkel. A `||` úgy egyesít, hogy a
-- TÁROLT érték nyer: csak a hiányzó kulcsok kapnak alapértéket, a testreszabás megmarad.
-- (Az E-41 négy méret-tokenje is itt kerül pótlásra: akkor ez a lépés kimaradt, ezért az
-- adatbázisban lévő közös alap nem ment át az ellenőrzésen, és a tartalék téma futott.)
UPDATE "tema"
SET "definicio" = jsonb_set(
  "definicio",
  '{tokens}',
  '{"--fs-hero":"52px","--fs-hero-sm":"32px","--fs-szekcio":"26px","--fs-zaro":"30px","--foto-hero":"55","--foto-zaro":"32","--fatyol":"70"}'::jsonb
    || ("definicio" -> 'tokens')
)
WHERE NOT ("definicio" -> 'tokens' ? '--foto-hero');
