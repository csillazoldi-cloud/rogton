# Névtelen visszajelzés a belépés előtti lapokról

**Dátum:** 2026-10-06 · **Állapot:** ELFOGADVA — Csilla 10-06 12:59 („Vilmosra nem várunk, minden ebben a körben megy”).
**Vilmos (biztonság):** utólagos átnézés kell — ez nyilvános (belépés nélküli) írást nyit a rendszerre.

## A kérdés
Kati (10-02): a lebegő Visszajelzés gomb a fiók létrehozásán, a belépésen és az első beállítás lapjain („Mutasd be a szervezetet”)
nem volt ott, pedig a tesztelő itt akad el először. Ott nincs munkamenet, a `POST /api/visszajelzes` viszont „tag” szintű volt.

## A döntés
- A végpont szintje **nyilvános**, két úton (app/api/visszajelzes/route.ts):
  - belépett fiók munkatérrel → a régi út, változatlan (szerződés-határok, korlát nincs);
  - munkamenet nélkül (**névtelen**), vagy belépve, de még munkatér nélkül → **szűk út**.
- A szűk út a belépési védelem (E-34, hitelesites/korlat.ts) mintája: **cím szerinti** korlát, `visszajelzes` fajta, **10 / óra**,
  minden kísérlet számít (a sikeres is, mint a regisztrációnál), 429 + Retry-After. A törzs legfeljebb **450 000 bájt** (a beolvasás a
  határon megáll, Content-Length nélkül is), a szöveg legfeljebb **1000** karakter, kép **csak PNG adat-URL** (a modul saját képernyőképe);
  más fájl, formátum vagy külső cím 400.
- Tárolás (0148): `visszajelzes.szervezet_id` és `fiok_id` NULL is lehet, új `nevtelen` jelző. A tulajdonos a saját munkaterére szűrt
  listát látja — a NULL munkaterű (névtelen) sor neki **nem** jelenik meg, csak a rendszergazdának (A-11).
- A képernyőképre jelszómező soha nem kerül (a „Jelszó mutatása” után sem): a modul szűrője kihagyja (visszajelzes-react).
- Telefonon (≤ 640 px) ezeken a lapokon a gomb nem lebeg, hanem a lap végén áll: lebegve az első képernyőn rátakart a „Készítsük el”
  gombra (mérve 390 × 844-en). Asztalon lebeg, mint eddig.

## Amit tudni kell (korlátok)
- A cím szerinti korlát csak második védvonal: ugyanaz a „jobbról számolt x-forwarded-for”, mint a belépésnél; „ismeretlen” címet
  (proxy nélküli kérés) nem számol — ez a belépési védelem meglévő viselkedése, nem új rés. Helyben (`next start`) minden kérés
  127.0.0.1, ott a 10 / óra azonnal mérhető.
- A képernyőképen az e-mail-mező tartalma látszhat (a jelszó nem).
- A napi javítócsomag mérése az első MUNKATÉRHEZ kötött visszajelzésre kerül; ha aznap csak névtelen volt, a munkatér-sor elmarad.

## Elvetett alternatívák
- **Külön nyilvános végpont** (`/api/visszajelzes/nevtelen`): két kód ugyanarra; a modul egyetlen címre küld.
- **Captcha**: új elem a képernyőn (Tibor-szabály), és harmadik féltől függ.
- **Fiók nélküli sor kitalált „rendszer” fiókkal**: hamis adat a listában és a csomagban.
