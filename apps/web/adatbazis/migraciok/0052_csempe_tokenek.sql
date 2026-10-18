-- F-2 (R-1 v3): két új alaptoken a kezdőképernyő csempéihez — a R-1 átadó tokenek.md 3. pontja kérte őket:
--   --tile-min  300px  a csemperács egy hasábjának minimális szélessége (ez dönti el, hol tör sorba a rács)
--   --fs-metric 30px   a csempék mérőszáma (új találatok, összeg, fiókszám)
-- Méretek, nem térközök, ezért nem a --ter-* skálából származnak. A Theme-lapon állíthatók (Betűméret, illetve Egyéb/haladó).

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.fs_metric', 'hu', 'Mérőszám a csempéken'),
  ('tema.fs_metric', 'ro', 'Cifra mare pe carduri'),
  ('tema.fs_metric', 'en', 'Tile metric size'),
  ('tema.tile_min', 'hu', 'Csempe legkisebb szélessége'),
  ('tema.tile_min', 'ro', 'Lățimea minimă a cardului'),
  ('tema.tile_min', 'en', 'Minimum tile width')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- A tárolt KÖZÖS ALAP kiegészítése a két tokennel (a TÁROLT érték nyer — E-44 tanulsága, mint a 0044-ben).
UPDATE "tema"
SET "definicio" = jsonb_set(
  "definicio",
  '{tokens}',
  ('{"--tile-min":"300px","--fs-metric":"30px"}'::jsonb || ("definicio" -> 'tokens'))
)
WHERE NOT ("definicio" -> 'tokens' ? '--tile-min') OR NOT ("definicio" -> 'tokens' ? '--fs-metric');
