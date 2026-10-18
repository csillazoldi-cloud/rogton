-- 0184: G6b (Rögtön, 2026-10-18) — a 0001/0003 mintafiókjai (anna@teszt-a.example, andras@teszt-a.example, bela@teszt-b.example) és
--   a két mintaszervezetük (Teszt Szervezet A / B) éles adatbázisban se legyenek használhatók. NEM törlünk (szabály): a fiókok
--   FELFÜGGESZTVE lesznek — ez a meglévő mechanizmus (E-50, fiok.felfuggesztve): a belep() és az aktualisFiok() is elutasítja a
--   felfüggesztett fiókot. A rendszergazda-jelölésük (ha valaha kaptak) lekerül. A két szervezetnek nincs „kivont” állapota: az
--   egyetlen tagjaik a felfüggesztett mintafiókok, és az AI-t kikapcsoljuk náluk (ai_engedelyezve = false), hogy a háttérben futó
--   hírfigyelés se költsön rájuk. A sorok és az azonosítók maradnak (a sorszintű védelem próbái ezekre építenek).
--   A tools/tiltott őr (--db, és a kirak.sh) piros, ha éles adatbázisban AKTÍV (nem felfüggesztett) .example fiók van.
--   Ismételhető.
--
-- Próbafuttatás (várt kimenet: UPDATE 3, UPDATE 2, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0184_g6b_mintafiokok_kivonva.sql; echo "ROLLBACK;"; } | docker exec -i gma-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km

UPDATE "fiok"
SET "felfuggesztve" = COALESCE("felfuggesztve", now()), "rendszergazda" = false
WHERE "id" IN ('aaaaaaaa-0001-4000-8000-000000000001', 'aaaaaaaa-0002-4000-8000-000000000002', 'bbbbbbbb-0001-4000-8000-000000000001')
  AND "email" LIKE '%@teszt-_.example';

UPDATE "szervezet"
SET "ai_engedelyezve" = false
WHERE "id" IN ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
