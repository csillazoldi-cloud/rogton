-- 0115: 2026-09-21 (Vilmos, D2) — az Éjkék séma fényudvar nélkül: --aurora-opacity 0.
-- A csomag alapja (tema-alap.json) már 0; itt a TÁROLT közös alapot és azokat a munkatér-verziókat
-- igazítjuk, amelyek az Éjkék 50-es értékét hordozzák (alkalmazott + tervezet; a korábbiak maradnak).
-- A Világos és a Sötét eleve 0, így minden 50-es érték az Éjkéké.
UPDATE "tema"
SET "definicio" = jsonb_set("definicio", '{tokens,--aurora-opacity}', '"0"'::jsonb)
WHERE "allapot" IN ('alkalmazott', 'tervezet')
  AND "definicio" -> 'tokens' ->> '--aurora-opacity' = '50';

UPDATE "szervezet_tema"
SET "felulirasok" = jsonb_set("felulirasok", '{--aurora-opacity}', '"0"'::jsonb)
WHERE "allapot" IN ('alkalmazott', 'tervezet')
  AND "felulirasok" ->> '--aurora-opacity' = '50';
