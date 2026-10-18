-- 2026-09-19 (Vilmos): az Éjkék gombszín (#5b6cff) fehér betűvel 4,2:1 volt — a 4,5:1 alatt. Új: #4b5ee3 (5,2:1).
-- A közös alap tárolt verzióin is átírjuk, ahol még a régi érték áll (alkalmazott + tervezet); a korábbi verziók maradnak.
UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--primary}', '"#4b5ee3"'::jsonb)
WHERE "allapot" IN ('alkalmazott', 'tervezet')
  AND "definicio" -> 'tokens' ->> '--primary' = '#5b6cff';
