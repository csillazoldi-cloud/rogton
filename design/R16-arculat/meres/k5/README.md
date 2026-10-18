# R-16 K5 — 12e „Betűk” helyben végigjátszva (2026-09-30)

Helyben: Postgres 16 a 0000–0138 migrációkkal (a 0137 a K4-é, itt nincs), `next start` (az m-k5 ág buildje), a képgyártó Chromium 1194-gyel,
Playwright 1440 × 900 és 390 × 844. Az AI szándékosan nem érhető el (`helyi-ollama` → 127.0.0.1:9). Munkatér: „Kövesi Térkő”, nyelvek hu + ro
(a Természetes alapszett: Archivo „Erős” / Public Sans „Tiszta”). A T-szabályokat a `tools/tibor-proba` mérője (`MERO_JS` + `ertekel`) mérte:
`tibor-meres.json` — **6/6 lapnézet zöld** (a Tibor-bíráló — gemma a Dellen — innen nem érhető el, az nem futott). A lépések kimenete: `naplo.txt`.

| Kép | Mit mutat (mérve) |
|---|---|
| `12e-asztali-friss.png`, `12e-telefon-friss.png` | Friss munkatér, a rajz állapota: öt sor, mindegyik a saját betűjével (a DOM-ban `KB Archivo` … `KB Gelasio`, mind betöltve), asztalon halkan a név; ✓ az Erősön (a mostani cím-betű). Telefonon a név nincs, a fő gomb alul (772–824), a Visszajelzés (706–752) nem takar, scrollWidth 390. Tibor: asztal 33 szó, telefon 17 szó, egy fő gomb („Ez legyen”). |
| `12e-asztali.png` → `12e-asztali-modern-tiszta.png`, `12e-elonezet-nagy.png` | Cím: Modern (Space Grotesk) koppintásra az előnézet újraíródik (POST `betuk`); Szöveg fül (`?ful=szoveg`): Klasszikus → Tiszta, újraíródik. |
| `12c-modern-tiszta.png` | „Ez legyen” → a szakasz (12c): „Cím: Modern · Szöveg: Tiszta”; a profil: jóváhagyva, 1. verzió, `betu_cim = space-grotesk`, `betu_szoveg = public-sans`. |
| `kep-kesz-modern-tiszta.png` (a Képek GET-je, a képgyártótól), `kep-html-modern-tiszta.png` | A kép: a cím Space Grotesk, a sor Public Sans — a vizual-core HTML-jében mérve: `cím = "Space Grotesk"`, `sor = "Public Sans"`, betöltve: Space Grotesk, Public Sans, IBM Plex Mono. Szemmel is: a cím geometrikus groteszk, a szöveg a Public Sans. |
| `12e-asztali-sajat-betu.png`, `12e-elonezet-sajat.png` | „Saját betűm van” → Caladea-Italic.ttf (OFL, a gépen lévő betű; mérve: nincs benne ș ț Ș): hatodik sor „Saját: Caladea” a saját betűjével, kiválasztva; alatta a licencmondat és EGY halk sor: „Ebből a betűből hiányzik néhány ékezet (ș ț Ș). Ezeket a Public Sans betűvel írjuk.” — nem piros, baj-doboz nincs. Tibor: 55 szó (≤ 60). |
| `12c-sajat-cim.png` | „Ez legyen” → 12c „Cím: Caladea” a saját betűjével (FontFace a `/api/arculat/fajl/<id>`-ről), 2. verzió, `betu_cim = sajat:<id>`. |
| `kep-kesz-sajat-cim.png`, `kep-html-sajat-cim.png` | A Képek GET-je: a cím Caladea Italic (a bájt adat-URL-ként ment a képgyártóig), a szöveg Public Sans. A HTML-ben a ș ț a tartalék Public Sans-szal íródik (szemmel: álló, vastag ș ț a dőlt címben — ez a „tartalék betű”). |
| `12e-asztali-hiba.png` | PNG „betűként”: egy mondat, „Ezt a fájlt nem tudjuk betűként használni. Tölts fel TTF, OTF vagy WOFF2 fájlt.” + „Rendben” (415, a lemezre nem kerül). Utána Poppins-Regular.ttf (teljes): csak a licencmondat, ékezet-sor nincs. |
| `12e-telefon.png`, `12e-telefon-teljes.png` | Telefon a két saját betűvel: vízszintes görgetés nincs, a fő gomb alul, nem takar. Tibor 37 szó. |

A sorok szavai a rajzon 600-as súlyúak (Public Sans, Space Grotesk, IBM Plex Sans); a web `public/kepbetuk/` másolata csak 400 + 700 súlyt
hoz (K3), ezért a böngésző ezeket 700-zal rajzolja — a különbség szemmel alig látható; a képgyártó képeit nem érinti.
