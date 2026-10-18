# R-16 K6 — 12g „Készítsünk egyet?” (névlogó) helyben végigjátszva (2026-09-30)

Helyben: Postgres 16 a 0000–0139 migrációkkal (a 0139 próbafuttatása: `INSERT 0 15`, `ROLLBACK`), `next start` (az n-k6 ág buildje),
a képgyártó Chromium 1194-gyel (az új `POST /nevlogo`-val és a fontkit-porttal), Playwright 1440 × 900 és 390 × 844. Az AI szándékosan nem
érhető el (`helyi-ollama` → 127.0.0.1:9), így tervezet nincs: a munkatér az alapszettel indul (pékség → Meleg: #a4471f · #e3a857 · #fbf3e8,
Gelasio „Klasszikus” / Public Sans „Tiszta”). A T-szabályokat a `tools/tibor-proba` mérője (`MERO_JS` + `ertekel`) mérte:
`tibor-meres.json` — **6/6 lapnézet zöld** (a Tibor-bíráló — gemma a Dellen — innen nem érhető el, az nem futott). A lépések: `naplo.txt`.

| Kép | Mit mutat (mérve) |
|---|---|
| `12a-asztali-nincs-logom.png`, `12a-telefon-nincs-logom.png` | Cipó Pékség logó nélkül: a Logó sorban a „Még nincs” mellett a „Nincs logóm” (asztal); telefonon a „Így jó, logó nélkül” mellett (a rajz 12a). Tibor: 45 / 29 szó, zöld. |
| `12g-asztali.png` (+ `-kartya-nev/kor/negyzet.png`) | A link → `/fiok/arculat/nevlogo`: „Készítsünk egyet?”, három kártya — fölül a logó a háttérszínen (a `GET /api/arculat/nevlogo/<stílus>` PNG-je: `sav-*.png`), alatta egy kész kép (Kész munka, világos) a JELÖLT névlogóval (POST helyzet-minta `nevlogo`). Gelasio, Meleg színek. A rajz szerint a körös van kijelölve; egy fő gomb („Ez legyen”), halkan „A négy helyre mi tesszük.” és „Inkább feltöltöm”. Tibor: 20 szó, zöld. |
| `12g-asztali-negyzet-kijelolve.png` | Koppintás a harmadikra: csak a kettős keret mozog. |
| `12c-nevlogo-meleg.png` | „Ez legyen” → 12c „Így készülnek a képeid”, a Logók sorban négy hely (világos · sötét · egy színnel · négyzetes); az adatbázisban 8 sor (4 hely × PNG + SVG), mind `eredet = gep`; a profil: jóváhagyva, 1. verzió, `nevlogo_stilus = kor`. Tibor: 37 szó, zöld. |
| `kep-kesz-vilagos-meleg.png`, `kep-kesz-szines-meleg.png` | A Képek GET-je (a tárolt fájlokkal): világoson a világos, a színesen a sötét változat. |
| `12c-nevlogo-friss.png`, `kep-kesz-vilagos-friss.png` | 12d „Friss” → „Ez legyen”: a névlogó újra készült az új színekkel (8 → 16 sor, mind a négy csempe új fájl). |
| `12c-feltoltott-vilagos.png`, `kep-kesz-vilagos-feltoltott.png`, `kep-kesz-szines-harmadik.png` | Feltöltött logó a világos helyre, majd újabb színváltás (Természetes): csak a három gépi hely készült újra (+6 sor); a feltöltött sor érintetlen, a világos csempe és a világos kép a feltöltött logóé. |
| `12f-nincs-logom.png` | 12f linkjei: „Melyik hova?” · „Nincs logóm” · „Vissza” (a rajz 12f). |
| `12g-telefon.png` (+ `-teljes`), `12g-telefon-negyzet.png`, `12c-telefon-negyzet.png` | Román munkatér („Știință și Țară SRL”) telefonon: a három logó egymás alatt, alattuk a kijelölt a két kész képen (150 + 104); scrollWidth 390, a fő gomb alul (772–824), a Visszajelzés (706–752) nem takar; a rejtett asztali kártyák képet nem kérnek. Tibor: 20 szó, zöld. Négyzetes → „Ez legyen” → 12c négy csempe. |
| `12g-asztali-stiinta.png` | Ugyanez asztalon (Ș Ț ă a Gelasio latin-ext fájljából). Tibor: 20 szó, zöld. |
| `sav-ordogh-negyzet-space-grotesk.png`, `kep-kesz-szines-ordogh-space-grotesk.png` | „Ördögh Ősz Árpád Kft.”: a szöveg-betű váltása nem nyúl a logóhoz; a cím-betű (Space Grotesk) váltása a négy gépi helyet újra elkészíti. |
| `fust-attekintes.png`, `fust-naplo.txt` | A képgyártó füstpróbája (`apps/kepgyar/probak/nevlogo-fust.ts`): a három próbanév minden karaktere valódi glif (nem .notdef) mind az öt beépített betűvel és a Caladea TTF-fel (az Ő ű Ș ț ă a latin-ext fájlból); 3 név × 3 stílus × 4 változat PNG: 1200 széles (négyzetes 1024²), átlátszó sarok, van festék. A 44 karakteres név két sorra tört. |

A kép a logót a K2 szabálya szerint 12 egység (54 px) magasan teszi fel; a rajz kártyáján a logó ennél nagyobb — ez a K2 képgépe, nem a
névlogó dolga. A névlogó SVG-je csak útvonal (nincs `<text>`, szkript, külső hivatkozás); kiszolgálásakor `image/svg+xml`,
`content-security-policy: default-src 'none'; style-src 'unsafe-inline'`, `nosniff`.
