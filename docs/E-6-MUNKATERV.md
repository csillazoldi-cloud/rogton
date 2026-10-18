# E-6 munkaterv — az onboarding 1. lépése kódban, piszkozat-mentéssel

Készült: 2026-09-07 hajnal, az E-5 rajz jóváhagyására várva. **Ez terv, nem elvégzett munka.**

## Mi készül (az ELSO-EPITESI-EGYSEG E-6 sora szerint)

„Kitöltöd, kilépsz, visszajössz — ott folytatod, ahol abbahagytad." Bizonyítja: A-04 (mentési hiba nem
mutat sikert, visszatéréskor tényleg visszatöltődik a piszkozat), és elindítja A-01-et.

## Adat

- `onboarding_piszkozat` tábla (ügyféladat → sorszintű védelem, `szervezetKent` alatt):
  `szervezet_id` (PK), `lepes` (1–3), `adatok` jsonb (a három lépés mezői, kulcsonként), `frissitve`.
  Egy szervezethez egy piszkozat. A jóváhagyáskor (E-9) átadódik a hostnak, és a piszkozat törlődik (R-06).
- A jsonb szerkezete a `@km/contracts`-ban zod-dal leírva (`OnboardingPiszkozat`), verziószámmal a
  jövőbeli bővítéshez. Az 1. lépés mezői: `nev`, `forras_tipus` ("weboldal" | "leiras"), `weboldal`,
  `leiras`, `dokumentum` (E-6-ban még csak helye van; a feltöltés a 6. tárolási pontnál jön),
  `arculat_forrasok` (jelölések: logó / kézikönyv / referenciák / a weboldal is forrás).

## Gépezet

- `GET /api/onboarding/piszkozat` → a bejelentkezett ember AKTUÁLIS szervezetének piszkozata (vagy üres).
- `PUT /api/onboarding/piszkozat` → a teljes piszkozat mentése (zod-dal ellenőrizve), válasz: `frissitve`.
  A felület minden mezőváltozás után ~800 ms-mal ment („Piszkozat mentve" / „Mentés…" / „Nem sikerült
  menteni — újrapróbáljuk" a fejlécben, a rajz szerinti helyen). Hálózati hibánál a felület NEM mutat
  sikert, és a következő változásnál újrapróbál (A-04).
- „Aktuális szervezet": a fiók első (egyetlen) szervezete; a több szervezet közti választás külön lépés,
  nem E-6. Ha nincs szervezet → `/szervezet/uj`.
- „Mentés és kilépés": ment, majd kilép (E-3 kilépés), és `/belepes`-re visz.
- „Összefoglaló készítése" gomb: E-6-ban a gomb MEGVAN, de az AI-hívás az E-7-ben jön; addig a gomb a
  szerződés szerinti „teszt-csatlakozót" hívja (rögzített minta-összefoglaló), hogy a folyamat kipróbálható
  legyen kulcs nélkül (ELSO-EPITESI-EGYSEG 4. pont). Ezt a rajzon nem kell jelölni; a viselkedés a szerződésben.

## Képernyő

Pontosan az E-5 rajz (jóváhagyás után). Fejléc: szervezet neve, nyelvválasztó, mentési állapot, „Mentés és
kilépés". Lépésjelző 1/3. Bal kártya: az űrlap. Jobb kártya: profil-előnézet, amely a piszkozatból ÉLŐBEN
frissül (NÉV a névmezőből; a többi sor E-8-ig „Még nincs megadva").

## Ágensek (3, a terv szerint)

| Szerep | Modell | Feladat | Elhatárolás |
|---|---|---|---|
| Építő A | DeepSeek | séma-migráció után: `apps/web/onboarding/piszkozat.ts` (olvasás/mentés `szervezetKent` alatt) + a két API-pont | csak ezek a fájlok |
| Építő B | DeepSeek | a képernyő komponensei a rajz szerint: `app/onboarding/1/…` (űrlap, előnézet, mentés-állapot, „Mentés és kilépés") a `useFeliratok` kulcsaival | csak `app/onboarding/**` |
| Tesztelő | Kimi k2.6 | próbák: mentés → kilépés → belépés → visszatöltés; mentési hiba nem mutat sikert; más szervezet piszkozata nem látszik | csak `probak/onboarding.proba.ts` |
| Fordító | Kimi k2.6 | az új feliratok RO/EN | csak `feliratok/{ro,en}.json` új kulcsai |

Az összefogó (Claude) írja: a séma és a migráció, a `@km/contracts` bővítése, a HU feliratok, a feladatfájlok,
és az összefésülést, a tokenőrt, a fordított ellenőrzést (képernyő a rajzhoz).

## Idő

Terv: 3 óra. Sorrend: séma + szerződés (20 perc) → három ágens párhuzamosan (10 perc) → összefésülés és
próbák (60 perc) → kirakás + végigjátszás + képernyőképek (30 perc) → tartalék.

## Amit kérdezni fogok, mielőtt indul

1. Az E-5 rajz jóváhagyása (ez a kapu).
2. Semmi más — az AI-szolgáltató kérdése az E-7-nél jön, egy kérdésben, ahogy az alapterv írja.
