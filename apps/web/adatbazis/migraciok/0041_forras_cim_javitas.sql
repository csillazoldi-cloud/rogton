-- E-49: a protokoll nélkül elmentett forráscímek javítása.
--
-- Az E-42 előtt a rendszer ÚGY mentette el a címet, ahogy a felhasználó beírta. Aki azt írta be,
-- hogy „zi-de-zi.ro”, annak ez került az adatbázisba — a séma viszont teljes címet vár, ezért a
-- beolvasás kivételt dobott, és a hírfigyelő ÁTTEKINTŐ LAPJA EGYÁLTALÁN NEM TÖLTŐDÖTT BE.
-- Egyetlen rossz sor vitte le az egész képernyőt.
--
-- Itt a sorokat javítjuk; a beolvasás tűrőképességét a kód oldja meg (apps/web/hirfigyelo/tar.ts).
-- Csak azt a sort bántjuk, aminek az első perjel előtti része VALÓDI tartománynévnek látszik.
-- A javított sor újra ellenőrzésre kerül, hogy a hírfolyamát is megtalálja a rendszer.
UPDATE "hf_forras"
SET "cim" = 'https://' || "cim",
    "allapot" = 'ellenorzes_alatt',
    "hiba_ok" = NULL,
    "ellenorzott" = false
WHERE "cim" NOT LIKE 'http://%'
  AND "cim" NOT LIKE 'https://%'
  AND split_part("cim", '/', 1) ~ '^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$';
