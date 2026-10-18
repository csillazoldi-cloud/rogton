# R-16 K7 — a honlap logója fájlként + az átkapcsolás (/fiok → /fiok/arculat), helyben végigjátszva (2026-09-30)

**Helyben mérve, NEM élőben.** Postgres 16 a 0000–0139 migrációkkal (K7-nek nincs új migrációja), `next start` (az o-k7 ág buildje),
a képgyártó (az új `POST /svg-png`-vel) a Playwright Chromium 1194-gyel, Playwright 1440 × 900 és 390 × 844. AI: a teszt-csatlakozó
(`AI_SZOLGALTATO=teszt`), így az arculat-javaslat lefut, és a honlap színei felülírják. A netes cégkutatás (OpenAI web search) innen nem
érhető el — ezért minden munkatér **megadott honlappal** indul (`forras_tipus = weboldal`), így a kutatás nem fut.

**A próba-honlapok:** `proba-honlap.py` egy helyi kiszolgáló, a Host fejléc szerint három céggel. A letöltő a helyi címeket jogosan
elutasítja (SSRF-védelem), ezért a három név a gép `/etc/hosts`-ában a gép nem-belső címére (192.0.2.2, TEST-NET-1) mutat — ez csak a
mérőkörnyezet beállítása, a kódban nincs kivétel. A végigjátszás: `vegigjatszas.py`, a lépések és a kiszolgáló naplója: `naplo.txt`,
a Tibor-számok: `tibor-meres.json`, a teljes Tibor-próba (mind a 42 lapnézet): `tibor-teljes/`.

| Kép / fájl | Mit mutat (mérve) |
|---|---|
| `12b-cipo-honlap-logo.png`, `12b-cipo-honnan.png`, `12b-cipo-telefon.png` | **PNG logó.** Új regisztráció, „Cipó Pékség”, honlap `http://cipo-pekseg.proba:8701/` (a logó `<img class="site-logo">`, a színek a CSS-ben). Az első beállítás jóváhagyása után a háttérmunka: `arculat_fajl` 1 sor — `png · logo · honlap · vilagos · 8634 bájt · cipo-logo.png`; a tervezet: `#a4471f · #e3a857 · #fbf3e8`, `szin_forras = honlap`, `forras_cim = http://cipo-pekseg.proba:8701/`, `szin_jeloltek = [#a4471f, #e3a857]`. A /fiok belépő sora → `/fiok/arculat`: 12b „Jól ismer a gép?”, a Logó sorban a honlap logója, „Honnan?” → a honlap címe. Tibor: 40 / 25 szó, zöld. |
| `kep-kesz-cipo-honlap-logo.png` | A Képek „Kész munka” képe (GET helyzet-minta) már a honlap logójával készül — az első napon. |
| `12b-stiinta-svg-logo.png`, `stiinta-svg-bol-png.png` | **SVG logó.** „Știință și Țară SRL” (román felület), a honlap logója `image/svg+xml`: a képgyártó rasztert csinált belőle, a tárban `png · honlap · vilagos · 9476 bájt`, a kiszolgált fájl `image/png`, PNG-fejjel. 12b román szöveggel, zöld (44 szó). |
| `12b-hibas-logo-nelkul.png` | **Letöltési hiba.** A honlap logó-címe 404: a jóváhagyás 200, a tervezet a honlap színeivel megjött, logó-sor nincs; a naplóban egy sor (`[honlap_logo] nem mentettük: letoltes_hiba … FORRAS_NEM_ELERHETO`); a 12b nyílik (a színek a honlapról), logó nélkül. A felhasználó semmit nem lát a hibából. |
| (naplo.txt, D.) | **R7.** Saját logó feltöltve a jóváhagyás ELŐTT, a honlapon is van logó: a háttérmunka után a logó-sorok változatlanok (1 sor, `feltoltes`), a honlap logóját le sem töltöttük. |
| `fiok-asztali.png`, `fiok-asztali-elso.png`, `fiok-telefon.png`, `fiok-telefon-elso.png` | **Az átkapcsolás.** A /fiok-on a „Vizuális arculat — tervezet” doboz (`<details>`, ArculatBlokk, ArculatAnyagok) helyén egy sor: a szakasz címe („Logó, színek, betűk”, `r16.arculat.szakasz`) és alatta balra a halk „Megnyitás” gomb (`fiok.arculat_megnyitas`) → `/fiok/arculat`. `details` 0, `#km-fp-anyagok` 0. Telefonon scrollWidth 390. |
| `fiok-*-elotte-rekonstrukcio.png`, `fiok-elotte-utana.json` | A /fiok ELŐTTE, rekonstruálva: ugyanazon a lapon a belépő sor helyére a régi, becsukott doboz összefoglalója (a régi jelölés, a régi CSS) — lásd lent. |
| `svg-png-1200.png`, `svg-png-negyzet.png`, `svg-png-szkript.png`, `svg-png-fust-naplo.txt` | A képgyártó füstpróbája (`apps/kepgyar/probak/svg-png-fust.ts`, HTTP-n a futó képgyártó): viewBox 4:1 → 1200 × 300, átlátszó sarok, a közép #a4471f; `szelesseg: 400` → 400 × 100; %-kódolt data URL, 300px × 300px → 1200 × 1200; szkript az SVG-ben NEM futott (a téglalap kék maradt); külső kép + `@import` egy helyi kiszolgálóra: 0 kérés; PNG data URL / `<svg>` nélküli szöveg / hibás XML / nem szöveg → 400 `ERVENYTELEN_TARTALOM`. |

## A /fiok Tibor-számai (tools/tibor-proba `MERO_JS` + `ertekel`, helyben)

| Fiók | Nézet | ELŐTTE (rekonstrukció) | UTÁNA |
|---|---|---|---|
| Cipó Pékség (honlapos) | asztali | 95 szó · fő gomb 0 · doboz-mélység 2 (T6) | **80 szó · fő gomb 0 · mélység 1** |
| Cipó Pékség | telefon | 66 szó · 0 · mélység 2 (T6) · T10: „Későbbre hagyva”, „Megnyitás” | **66 szó · 0 · mélység 1** · T10: „Későbbre hagyva”, a lábléc mondata |
| Tibor-próba fiók (leírásos) | asztali | 130 szó · 0 · mélység 2 · T3 ai-javaslat | **116 szó · 0 · mélység 1** · T3 ai-javaslat |
| Tibor-próba fiók | telefon | 74 szó · 0 · mélység 2 · T10: „Még nincs megadva”, „— nem kötelező” | **74 szó · 0 · mélység 1** · T10: „Még nincs megadva” |

A /fiok régi, át nem rajzolt lap, az alapban (`alap.json`) is piros (`proba: false`); a hibái (0 fő gomb, a jelvény „AI-javaslat” szava,
sok szó, a lebegő Visszajelzés gomb a mezők fölött görgetéskor) nem a K7-éi. A belépő sor egyik szabályt sem rontja: a T6 (doboz a dobozban)
eltűnt, a szó kevesebb vagy ugyanannyi, fő gomb nem jött (a belépő halk gomb, T2/T6). **Menet közben mérve és javítva:** az első változatban
a „Megnyitás” jobbra állt, és telefonon a lap aljára görgetve a Visszajelzés gomb eltakarta (T10) — ezért került a cím alá, balra.

## A teljes Tibor-próba (tibor-teljes/, 42 lapnézet, helyben) és az alap.json

20 / 42 zöld; mind a 12 arculat-lapnézet zöld (12f, 12a–c, 12d, 12d2, 12e, 12g × asztali/telefon). Az `alap.json`-hoz képest három
lapnézet „rosszabb”: `posztszoveg/asztali`, `posztszoveg/telefon` (T2: 0 fő gomb — a lap helyben 0–2 szót mutat, a teszt-AI-jal nem töltődik
be úgy, mint élőben) és `kepek-kitolto/asztali` (61 szó a 60 helyett). Egyikhez sem nyúlt a K7 (nincs változás a `/poszt` és a
`/kepek/uj/…` fájljaiban) — ez a helyi környezet (teszt-AI, más tartalom), nem a kód; a mainnel helyben nem vetettem össze.
**Az `alap.json`-t NEM frissítettem:** a Tibor-bíráló (gemma a Dellen) innen nem érhető el, `biralat.json` nélkül a `zar.py` nem nyit
(„a zár bíráló nélkül nem nyit”), és a ZAR.md szerint a `--frissit` csak nyitott zárnál írhat.

## Ami nincs mérve

- Élőben semmi (a teszt-oldalon a K7 még nincs kint). A képgyártó Dockerfile-ja a Gigabyte-on épül (az új `svg-png.ts` a
  `COPY apps/kepgyar` alatt van; a robot ujjlenyomata a változást jelzi).
- A netes cégkutatással talált honlap (honlap nélküli regisztráció) — az OpenAI innen nem érhető el; a kód ugyanazt a `sajatSzinek` utat járja.
- A honlapról jött logónak nincs `elemzes`-e (a böngészős elemzés a feltöltésé): a kép átlátszatlannak veszi, sötét háttéren lapra teszi
  (TERV §4 8.), nem színezi fehérre. A 12f „Melyik hova?”-ja sem javasol neki helyet — a világos helyre kerül.
