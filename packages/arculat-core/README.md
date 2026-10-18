# @rogton/arculat-core

R-16 · Arculat (TERV: `design/R16-arculat/TERV.md`). Verzió 0.2.0 (K1 + K3).

## 1. Mit csinál

Egy cég márkakészletének szabályait tartja: megnézi egy logó képpontjait, és megmondja, milyen (átlátszó-e, világos-e, hány
színű, milyen arányú, mik a fő színei), majd ebből eldönti, a négy logóhely közül melyikre való. Ha valaki egyszerre több logót
ad, mindegyiket helyre teszi úgy, hogy lehetőleg egyik se szorítsa ki a másikat. A későbbi csomagokban ide kerülnek a bevált
színszettek, a szakma → hangulat tábla, a színkör és a betűlista (K3–K5).

## 2. Mit kér a befogadótól

A `host.ts`:

- `Kepadat` — a logó képpontjai RGBA-ban, legfeljebb 64 × 64-re kicsinyítve (a böngészőben: canvas `getImageData`), és mellé az eredeti szélesség/magasság.
- `VanKarakter(kodpont)` — betű-port a K5-től: van-e a betűben az adott karakter (a webalkalmazásban a fontkit adja). A K1-ben még nincs hívója.
- Óra, azonosító, esemény: nincs — a K1 szabályai időtlenek és mellékhatás nélküliek.

## 3. Mit ad vissza

- `logoElemzes(kep, eredetiSzelesseg, eredetiMagassag)` → `LogoElemzes` `{ atlatszo, vilagossag, szinszam, arany, szinek[] }` (zod-séma is: `LogoElemzes`).
- `javasoltHely(elemzes | null)` → `vilagos` · `sotet` · `egyszinu` · `negyzetes` (egy logó természetes helye; elemzés nélkül — PDF — `vilagos`).
- `besorol(elemzesek[])` → a helyek feltöltési sorrendben (egy csomag logó); `helyreAlkalmas(hely, elemzes)`.
- `elemzesFejlecbe(e)` / `elemzesFejlecbol(s)` — az `x-logo-elemzes` fejléc (base64url JSON, ≤ 2 KB); a rossz fejléc `null`, nem hiba.
- `sotetitve(hex)` — a fő szín árnyalattartóan sötétítve (a 12f sötét próbaháttere); `relativVilagossag`, `nemMarkaszin`, `hexbol`, `hexbe`.
- Küszöbök egy helyen: `ELEMZES_KUSZOB`, `HELY_KUSZOB`, `BESOROLAS_SORREND`.
- K3 (0.2.0): `SZETTEK` / `szett(id)` — a hat bevált színszett (fő · második · háttér + az alapkitöltés két betűje; ADAT, a tokenőr
  `KIVETEL`-listáján); `hangulatok(szoveg)` — a szakma → hangulat tábla (név + összefoglaló; kis/nagybetű és ékezet nem számít, a tő a
  szó elejére illik; egyezés nélkül természetes · megbízható · meleg); `alapSzett(szoveg)` — az első hangulat szettje (a 12a alapja);
  `BEEPITETT`, `betuKulcs(ertek)`, `betuSzo(kulcs)` — a képgyártó öt betűje, a régi CSS-szövegek kulcsa és a hangulatszó feliratkulcsa.

Események: nincsenek.

- K5 (0.2.0, csak bővítés): `BEEPITETT[].nev` (a betű neve a 12e halk sorához), `beepitettKulcs`, `sajatKulcs(id)` / `sajatBetuId(ertek)`
  (a saját betű kulcsa: `sajat:<fájl-azonosító>`), `TARTALEK_BETU` („Public Sans”), `EKEZETEK` (hu · ro, a román ș ț vesszős alakban),
  `hianyzoEkezetek(van, nyelvek)` — a `VanKarakter` porttal (a befogadó adja: a webalkalmazásban a fontkit), `BetuElemzes` +
  `betuElemzes(van, csaladNev, fajlNev)` (a tárolt vizsgálat mindkét nyelvre) és `hianyzoNyelvre(e, nyelvek)` (a munkatér nyelveire szűrve).

## 4. Hibakódok

A K1-ben nincs: minden függvény teljes (bármilyen bemenetre ad választ), az olvashatatlan fejléc `null`. A zárt lista
(`ARCULAT_HIBAKODOK`) a K5 betű-ellenőrzésével bővül.

## 5. Beillesztés

1. A `packages/arculat-core` mappa a workspace-ben; a befogadó `package.json`-jában `"@rogton/arculat-core": "workspace:*"`, és a gyökér `Dockerfile` függőség-rétegében a `package.json` COPY-sora (`node tools/hatar/dockerfile-or.mjs` ellenőrzi).
2. A böngésző a feltöltés előtt egy ≤ 64 × 64-es canvasra rajzolja a képet, és a `getImageData().data`-t adja a `logoElemzes`-nek.
3. Több fájlnál a `besorol` adja a helyeket; a feltöltés fájlonként `x-logo-valtozat: <hely>` és `x-logo-elemzes: elemzesFejlecbe(e)` fejléccel megy.
4. A kiszolgáló az `elemzesFejlecbol`-lal ellenőrzi az elemzést, és a fájl-modul `feltolt`-jának adja (`elemzes`), a hely a `logo_valtozat`.
5. Három határőr-szabály a `.dependency-cruiser.cjs`-ben (megvan: `arculat-core-csak-contracts-es-zod`, `alkalmazas-az-arculat-core-t-csak-a-bejaratan-at`, `az-arculat-core-nem-ismeri-a-befogadokat`).
6. Próbák: `pnpm --filter @rogton/arculat-core proba` — adatbázis, hálózat és canvas nélkül zöldek (K3: `probak/szettek.proba.ts`; K5: `probak/betuk.proba.ts`, hamis `van` porttal).

## Eltérések a TERV 1.4-től (K1, indokkal)

- **`szinszam` = a tinta színei.** Átlátszatlan képnél a perem ≥ 60 %-át adó szín a kép saját háttere, ez nem számít bele (és a
  `vilagossag`-ba sem). Ok: különben egy fehér hátterű JPEG sötét logó „világosnak” mérődne, és a sötét helyre kerülne.
- **Egyszínű = egy tintaszín ÉS átlátszó háttér** (nem „≤ 2 szín”). Ok: a rajz (12f) a kétszínű zöld–arany Kövesi-logót a „Világos
  háttérre” helyre teszi, és az egyszínű változatot külön mutatja; a képoldal (K2, gepezet 4) csak átlátszó logót tud átszínezni.
  A fehér egyszínű logó a sötét helyre kerül (a TERV próbája: „white-on-transparent → sotet”).
- **Ütközéskor a két háttér-helynek is van feltétele:** a világos helyre csak < 0,6 világosságú, a sötétre csak ≥ 0,35 világosságú
  logó mehet — különben egy fehér logó a világos képekre kerülne, ahol eltűnik.
