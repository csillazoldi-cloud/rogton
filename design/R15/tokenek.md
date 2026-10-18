# Tokenek — R-15 · Tibor-szabálylap

A rajz: `R15-szabalylap.dc.html`. A `design/semak/semak.css` nincs ebben a projektben; az alaptokenek (R-12 / R-12b nevek) mind a négy sémára itt vannak kiírva (Éjkék · Vegyes · Világos · Sötét); a rajz kapcsolójával mindegyik megnézhető, a 00-s sor mind a négyet egyszerre mutatja.

Az új R-15 tokenek **csak alaptokenekre mutatnak**, két kivétellel: a `--fo-gomb-bg` és a `--lap-bg` sémánként dől el (az Éjkék és a Vegyes átmenetet kap).

## 1. Új tokenek

| Csoport | Token | Érték | Szabály |
|---|---|---|---|
| Kérdés-cím | `--kerdes-fs` | 28px (asztali) | T1 |
| | `--kerdes-fs-tel` | 24px (390) | T1 |
| | `--kerdes-fw` | `var(--fw-head)` | |
| | `--kerdes-alcim` | `var(--text-mut)` | T1: egy mondat |
| Fő gomb | `--fo-gomb-bg` | Éjkék, Vegyes: `var(--grad-primary)` · Világos, Sötét: `var(--primary)` | T2 |
| | `--fo-gomb-text` | `var(--on-primary)` | |
| | `--fo-gomb-min` | 52px | T10 hüvelykujj |
| | `--fo-gomb-fs` / `--fo-gomb-fw` / `--fo-gomb-r` | `--fs-base` / `--fw-strong` / `--r-btn` | |
| Halk gomb | `--halk-gomb-bg` / `-border` / `-text` / `-min` | `--btn-ghost-bg` / `--btn-ghost-border` / `--text` / `--control-min` | T2 |
| | `--halk-link` | `var(--text-mut)`, aláhúzva | Részletek · Nem érdekel · Miért? |
| Teendő | `--teendo-bg` | `var(--bg-elev)` | T6 |
| | `--teendo-border` | `var(--field-border)` | T6 |
| | `--teendo-r` / `--teendo-pad` | `--r-card` / `--ter-9` | |
| Tájékoztatás | `--info-text` | `var(--text-mut)` | T6: se keret, se háttér, se gomb |
| | `--info-fs` | `var(--fs-sm)` | |
| Haladás | `--halad-text` / `--halad-szam` | `var(--text)` | T8 |
| | `--halad-sav` | `var(--panel-soft-2)` | 72×6 px sáv |
| | `--halad-telt` | `var(--ok)` | |
| Kész-pillanat | `--kesz-bg` | `var(--ok-bg)` | T8 |
| | `--kesz-jel` | `var(--ok)` (a ✓ kör) | |
| | `--kesz-text` | `var(--text)` | |
| Valódi baj | `--baj-bg` / `--baj-border` / `--baj-jel` / `--baj-text` | `--warn-bg` / `--warn-border` / `--warn` / `--text` | T7: csak gombbal együtt |
| Lap | `--lap-bg` | Éjkék, Világos, Sötét: `var(--bg)` · Vegyes: 180° #eef0f6 → #f6f6f8; sötét blokkon 150° #1d2344 → #12162a | a lap háttere |
| Lebegő hely | `--lebego-hely-tel` | 56px: sáv az alsó gombsáv fölött, jobbra a Visszajelzés | T10 |
| | `--lebego-hely-asztali` | 168px: szabad oszlop a tartalom jobb oldalán | T10 |
| Rajz | `--rossz-jel` | `var(--err)` | csak a szabálylapon (áthúzás) |

## 2. Az alaptokenek sémánként

| Token | Éjkék | Vegyes | Világos | Sötét |
|---|---|---|---|---|
| `--bg` | #0c0d13 | #f3f4f7 | #f6f6f8 | #1a1a1a |
| `--bg-elev` | #12141c | #ffffff | #ffffff | #262626 |
| `--text` | #e8ebf1 | #1a1c24 | #1a1c24 | #ededed |
| `--text-mut` | #9aa3b2 | #535a68 | #535a68 | #ababab |
| `--text-dim` | #7a8496 | #6f7684 | #6f7684 | #949494 |
| `--primary` | #4f5fd6 | #4f5fd6 | #4f5fd6 | #4f5fd6 |
| `--accent` / `--accent-text` | #ff4520 / #ff7a55 | #d8471f / #b93c19 | #d8471f / #b93c19 | #ff4520 / #ff7a55 |
| `--ok` | #7fe0a0 | #25764a | #25764a | #7fe0a0 |
| `--err` | #ffb3a3 | #c0392b | #c0392b | #ffb3a3 |
| `--grad-primary` | 120° #5563ee → #a06ff6 | 120° #5563ee → #a06ff6 | — | — |
| `--accent-link` | `--primary-2` | `--primary` | `--primary` | #c9ccd2 (semleges: a kék csak a gombon) |

A Sötét séma semleges grafit (szürke, kékes árnyalat nélkül, egy fokkal világosabb, mint az Éjkék), hogy a kettő első ránézésre különbözzön. Az értékeit a rajz javasolja (a `KERDES-sema-gepezet.md` 1. pontjára még nincs válasz). Ha a kódban más, a kód értéke érvényes, a tokennevek maradnak.

A **Vegyes** séma világos lapon sötét blokkokat használ. **A sötét jelentése: itt a dolgod.** Sötét a teendő-lap (`data-r15="teendo"`) és a felső sáv (`data-r15="sotet-sav"`). Minden más világos: a tájékoztatás, a haladás, a lista. A sötét blokk a saját tokenkészletét kapja (a táblázat a világos alapot mutatja): `--bg-elev` #171c33, `--text` #eef0f6, `--text-mut` #aab3c5, `--halk-link` #c3cad8, a háttér 150° #1d2344 → #12162a átmenet, keret nélkül. A kódban ez egy CSS-scope: `[data-sema="vegyes"] [data-r15="teendo"]`.

Kontraszt (mérve): `--text-mut` a Vegyes sötét blokkján 7,9, a világos lapon 6,6 · fehér a `--primary`-n 5,3 · `--text-mut` a `--bg`-n: Éjkék 7,4 · Világos 6,6 · Sötét 7,3 · `--ok` a `--bg-elev`-en Világosban 5,4.

## 3. Jelölés a mérő programnak

| Jelölés | Elem | Mit mér |
|---|---|---|
| `data-r15="kerdes"` / `"kerdes-alcim"` | a lap h1-e és az alatta álló mondat | T1: ≤ 6 szó · ≤ 1 mondat |
| `data-r15="fo-gomb"` | a fő gomb | T2: pontosan 1 a látható képernyőn · T10: ≥ 52 px, 390-en az alsó harmadban |
| `data-r15="teendo"` | teendő-lap | T6: nincs benne másik `teendo` / keretes elem |
| `data-r15="info"` | tájékoztató sor | T6: `border`, `background`, `button` = 0 |
| `data-r15="baj"` | valódi baj | T7: van benne gomb |
| `data-r15="halad"` / `"kesz"` | haladás-sor, kész-pillanat | T8 |
| `data-r15="reszletek"` / `"mely"` | a Részletek mögötti szöveg / Beállítások mélye | T3, T5: kizárva a számolásból |
| `data-r15-forras="gep"` | mező, amit a gép tölthet | T4: nem lehet üres |
| `data-r15-cel="poszt"` | a fő gomb, ha posztszövegre visz | T9: ≤ 1 kattintás |
| `data-r15="lebego"` | lebegő elem (Visszajelzés) | T10: semmit nem fedhet (szöveg, gomb, kép, alsó gombsáv), mindkét szélességen, görgetés közben sem |
| `data-r15-kepernyo="telefon"` / `"asztali"` | egy teljes képernyő külső eleme, felső sávval; a `section[data-screen-label="04 Hírek"]` belsejében | a vizsgálat 390×844 / 1440×900 ablakban nézi; az első ablakban ott kell lennie a `kerdes`-nek és a `fo-gomb`-nak |

**Tiltott szavak (T3), a látható szövegben:** futás · modul · szűrés · verzió · AI-keret · token · forrás-állapot · AI-javaslat. A ro · en megfelelőt a `feliratok.json` kulcsaiból kell venni (nem szólistából), hogy a mérés a fordítást is lefedje.

## 4. Nyitott: az átmenetes fő gomb kontrasztja
A fehér felirat az átmenet lila végén (#a06ff6) kb. 3,5–3,9:1, vagyis a kis szövegre előírt 4,5 alatt van. A mai éles gomb is így néz ki, ezért maradt. Ha a mérő a 4,5-öt a fő gombra is számolja, a lila vég sötétebb lesz (#8a5ee8 körül), és az átmenet megmarad.

## 5. Vilmos döntései (R-15 kiegészítés 1–2)
- A Visszajelzés **lebegő marad**, minden lapon. Minden lap rajza fenntartott helyet hagy neki (`--lebego-hely-*`).
- A Vegyes sémáról Vilmos még dönt. Az alapértelmezett séma továbbra is az Éjkék; a Vegyes csak rajz.
- A lapok rajzait Tibor szemével vizsgálják, kódolás előtt; a jelölések a 3. pontban.
