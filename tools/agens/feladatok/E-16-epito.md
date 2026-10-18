# Feladat — ÉPÍTŐ (E-16): a feliratok API-pontjai (szervezeti szint és közös alap)

Mellékelve: a TÉMA API-pontjai MINTÁNAK (`_kozos.ts` segéd, `tema/route.ts`, `tema/kozos/route.ts`, `tema/alkalmaz/route.ts`) és a
FELIRATOK műveletei (`szovegek/index.ts` — ezeket hívod, pontosan ezekkel a nevekkel). A feladat: ugyanaz a hét fájl a feliratokra,
az `apps/web/app/api/feliratok/` mappában, a minta szerkezetével egy az egyben.

1. `apps/web/app/api/feliratok/_kozos.ts` — a téma `_kozos.ts`-e, de az `eredmenyValasz` a `FeliratEredmeny<T>`-t kapja
   (import a `../../../szovegek`-ből), és a 400-as válasz törzse `{ hiba, felirat_hibak, figyelmen_kivul }` (nem `tema_hibak`).
   A sikeres válasz `{ feliratok: ertek }` (nem `{ tema }`).
2. `apps/web/app/api/feliratok/route.ts` — GET (bármely tag): `valasz({ feliratok: await szervezetAllapot(szervezet.id) })`;
   PUT (csak tulajdonos, 403): `eredmenyValasz(await szervezetTervezetMent(szervezet.id, be))`; DELETE (tulajdonos): `szervezetTervezetElvet`.
3. `apps/web/app/api/feliratok/alkalmaz/route.ts` — POST (tulajdonos): `szervezetAlkalmaz`.
4. `apps/web/app/api/feliratok/visszaallit/route.ts` — POST (tulajdonos): `szervezetVisszaallit(szervezet.id, be)`.
5. `apps/web/app/api/feliratok/kozos/route.ts` — GET/PUT/DELETE (rendszergazda): `kozosAllapot`, `kozosTervezetMent(be)`, `kozosTervezetElvet()`.
6. `apps/web/app/api/feliratok/kozos/alkalmaz/route.ts` — POST (rendszergazda): `kozosAlkalmaz()`.
7. `apps/web/app/api/feliratok/kozos/visszaallit/route.ts` — POST (rendszergazda): `kozosVisszaallit(be)`.

Az importok relatív mélysége a fájl helyéhez igazodik (mint a mintában). `export const dynamic = "force-dynamic"`, `cache-control: no-store`,
try/catch → 500 `BELSO_HIBA` a `console.error("Feliratok <pont> hiba:", h)` után. Nincs `any`, nincs új csomag, nincs próba.
Add vissza a 7 fájlt `=== FÁJL: <út> ===` blokkban.
