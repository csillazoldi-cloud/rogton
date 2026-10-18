-- 0164: R-18 2. kör (Csilla 2026-10-11): a böngészőfül a termék nevét mutatja. Minden „… — Kommunikációs munkatér” (RO „Spațiu de
-- (lucru de) comunicare”, EN „Communication(s) workspace”) végű oldalcím végződése a termék nevére cserélődik (fejlec.termeknev, 0163:
-- Posztgyár / Fabrica de postări / Post factory), a nyitólap címe maga a név. A tartalomban („munkatér” mint fogalom) NEM változik semmi.
-- A hf.oldalcim a @km/news-monitor-feliratok adatfájljában is átírva (feliratok-szinkron.proba: adatfájl = adatbázis).
-- Csak a közös feliratok (felirat tábla); szervezeti felülírás oldalcímre nincs. Ismételhető (a második futás 0 sort ír).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: UPDATE 60, UPDATE 3, ROLLBACK — helyben mérve, 0001–0163 után; a NAS-on eltérhet):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0164_r18_oldalcim_termeknev.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

UPDATE "felirat"
SET "szoveg" = regexp_replace("szoveg", ' — (Kommunikációs munkatér|Communications? [Ww]orkspace|Spațiu de (lucru de )?comunicare)$',
                ' — ' || CASE "nyelv" WHEN 'hu' THEN 'Posztgyár' WHEN 'ro' THEN 'Fabrica de postări' ELSE 'Post factory' END),
    "frissitve" = now()
WHERE "kulcs" LIKE '%.oldalcim'
  AND "szoveg" ~ ' — (Kommunikációs munkatér|Communications? [Ww]orkspace|Spațiu de (lucru de )?comunicare)$';

UPDATE "felirat"
SET "szoveg" = CASE "nyelv" WHEN 'hu' THEN 'Posztgyár' WHEN 'ro' THEN 'Fabrica de postări' ELSE 'Post factory' END,
    "frissitve" = now()
WHERE "kulcs" = 'nyitolap.oldalcim' AND "nyelv" IN ('hu', 'ro', 'en')
  AND "szoveg" <> CASE "nyelv" WHEN 'hu' THEN 'Posztgyár' WHEN 'ro' THEN 'Fabrica de postări' ELSE 'Post factory' END;
