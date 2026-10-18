# ATADO — R-7a · Első beállítás

Rajz: `rajz/R7a-elso-beallitas.dc.html` · nyolc artboard, a kérés 5. pontjának sorrendjében.
Minden szöveg feliratkulcsból, a kulcs az elem `data-fkulcs` attribútumában áll.
Az R-7e skála értékeivel rajzolva (alapszöveg 16 px, mező 46 px, semleges AI-jelvény).

| # | Artboard | Mi épül | Mi marad a régiből | Állapotok |
|---|---|---|---|---|
| 01 | Regisztráció 1440 | három mező, mezőnkénti hibaüzenet a mező alatt, állandó jelszó-súgó, „Jelszó mutatása”, célmondat, adatkezelési hivatkozás az űrlap alatt | a mezők sorrendje és a végpont | üres · üres beküldés hibákkal (a fókusz az első hibás mezőn) |
| 02 | Belépés 1440 | cím „Belépés”, mezőnkénti hiba, rossz párosnál egy mondat, „Elfelejtetted a jelszavad?” | a belépő űrlap | normál · rossz páros · 02/B visszaállító lap |
| 02/B | Jelszó-visszaállítás 1440 | egy lap a rendszergazdához irányítva (DÖNTÉS 3.4 A) | — | egy állapot; a {kapcsolat} adat nélkül nem kerül ki |
| 03 | 1. lépés 1440 | csak név · weboldal VAGY rövid leírás · „Javaslat készítése”; előnézet üresen egy mondattal; kompakt fejléc „1/3 · Bemutatkozás” + halk mentési állapot | a piszkozat mentése, az összefoglaló végpont | üres előnézet (kész javaslatnál a mai tartalom) |
| 04 | 1. lépés 390 | egy oszlop, összecsukott előnézet („Javaslat megnézése”), a fő gomb az első képernyőn | — | egy állapot |
| 05 | 2. lépés 1440 | négy kérdés egyszerű sorokban, egy halasztási mondat fent, mezőnkénti „később” kicsiben | a négy kérdés adata és a javaslat-végpont | A készül (haladásjelző, szerkeszthető mezők) · B kész (semleges jelvény) · C nem sikerült (mondat + Újrapróbálás) |
| 06 | 3. lépés 1440 | egy szerkeszthető összefoglaló, soronkénti semleges eredet-jelölés, ugyanaz a nyelvválasztó, mint az 5-ön | a jóváhagyás végpont | egy állapot |
| 07 | Kész 1440 | „Kész — a szervezet adatai mentve.” fő gomb „Hírforrások megadása”, másodlagos „Szervezet adatai megnézése” | — | egy állapot |
| 08 | 2. és 3. lépés 390 | egy oszlop, a fő gomb alul rögzítve | — | két artboard egymás mellett |

## Ami elmarad (és hova megy)
- 1. lépés: dokumentum, logó, kézikönyv, referenciák, arculati forrás → R-7c 10 (Szervezet adatai · Arculat).
- 3. lépés: a jobb oldali profil-előnézet és az arculat-blokk (színek, betűk, mintakártya, feltöltők) → R-7c 10.
- Kész lap: az arculatot figyelmeztető doboz helyett egy halk mondat említi.

## Változott kulcsok (ugyanaz a kulcs, új érték)
- `fiok.belepes_cim` (változott) — „Belépés a munkatérbe” → „Belépés”
- `onboarding1.javaslat_gomb` (változott) — „Összefoglaló készítése” → „Javaslat készítése”
- `onboarding.mentes_es_vissza` (változott) — „Mentés és kilépés” → „Mentés és vissza” (DÖNTÉS 3.2 A)
- `onboarding1.elonezet_ures` (változott) — a „Még nincs megadva” jelvények helyett egy mondat
- `onboarding3.cim` (változott) — „Ellenőrzés és jóváhagyás” → „Nézd át az adatokat.”
- `jelzes.javaslat` (változott) — az „AI” szó helyett „javaslat”, semleges színnel

## Telefonos eltérések (390)
Egy oszlop; az előnézet összecsukva; a fő gomb a 2. és 3. lépésen alul rögzítve; vízszintes görgetés nincs; minden vezérlő legalább 46 px.
