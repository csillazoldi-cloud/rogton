-- R-7e (D-F43): a vizuális skála új értékei.
--   --fs-base 15px → 16px, --fs-title 16px → 17px, --control-min 44px → 46px, --lh 1.55 → 1.5
--   --accent-link #ff6a40 → #7f8fff (a link nem figyelmeztetés; a mai --primary-2 értéke)
--   két új token: --urlap-max 680px (űrlapok, egyoszlopos lapok), --lista-max 1180px (listák, kezdőlap)
-- A származtatott skála (--fs-md/sm/xs/h2) arányossá vált; az alsó korlát 12,5px.
-- A szervezeti felülírást nem bántjuk: az érték-frissítés csak ott fut, ahol a régi alapérték áll.

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.urlap_max', 'hu', 'Űrlap legnagyobb szélessége'),
  ('tema.urlap_max', 'ro', 'Lățimea maximă a formularului'),
  ('tema.urlap_max', 'en', 'Form maximum width'),
  ('tema.lista_max', 'hu', 'Lista legnagyobb szélessége'),
  ('tema.lista_max', 'ro', 'Lățimea maximă a listei'),
  ('tema.lista_max', 'en', 'List maximum width')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- A tárolt KÖZÖS ALAP kiegészítése a két új tokennel (a TÁROLT érték nyer — E-44 tanulsága, mint a 0044-ben).
UPDATE "tema"
SET "definicio" = jsonb_set(
  "definicio",
  '{tokens}',
  ('{"--urlap-max":"680px","--lista-max":"1180px"}'::jsonb || ("definicio" -> 'tokens'))
)
WHERE NOT ("definicio" -> 'tokens' ? '--urlap-max') OR NOT ("definicio" -> 'tokens' ? '--lista-max');

-- A tárolt közös alap ÉRTÉKEINEK frissítése — csak ott, ahol a régi alapérték áll (a szervezeti felülírást nem bántjuk).
UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--fs-base}', '"16px"'::jsonb)
WHERE "definicio" -> 'tokens' ->> '--fs-base' = '15px';

UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--fs-title}', '"17px"'::jsonb)
WHERE "definicio" -> 'tokens' ->> '--fs-title' = '16px';

UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--control-min}', '"46px"'::jsonb)
WHERE "definicio" -> 'tokens' ->> '--control-min' = '44px';

UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--lh}', '"1.5"'::jsonb)
WHERE "definicio" -> 'tokens' ->> '--lh' = '1.55';

UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--accent-link}', '"#7f8fff"'::jsonb)
WHERE "definicio" -> 'tokens' ->> '--accent-link' = '#ff6a40';
