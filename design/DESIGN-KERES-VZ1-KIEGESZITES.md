# Design-kérés — VZ-1 kiegészítés · a szerkesztő különleges mezői

2026-09-23 · Aitmetica SRL · Írta: a fejlesztő oldal (Claude), Vilmos kérésére.
**Ezt a lapot egészben add át a Claude Designnak.** Előzmény: a VZ-1 rajzcsomag (`design/vz1/`) — a keret, a kiférés-sáv,
a jelzések, a kép és a letöltés **változatlanul marad**, csak az alábbi mezőfajták rajza hiányzik.

## Miért kell
A VZ-1 rajz minden mezőt két szövegmezőként (magyarul · románul) mutat. A három valódi sablon mezőinek egy része viszont
nem két nyelvű szöveg, hanem más adat. Ezeket rajz nélkül nem építjük meg (a rajz a szerződés).

## A mezőfajták — a gépezet mindegyikhez kész
| Sablon · mező | Mit tárol | Szabály |
|---|---|---|
| Zavar · **Állapot** | egy a háromból: zavar · késés · helyreállt | kötelező; a kép tetején színes sáv lesz belőle |
| Zavar · **Járat** | a járat száma/kódja (pl. 23); a név („Linia 23 · 23-as járat”) a munkatér sablonjából magától jön | kötelező; a név felülírható, de nem kell |
| Zavar · **Időtartomány** | kezdet és vég, óra:perc (24 órás); pipa: „a vég közelítő” (a képen „kb.”) | kötelező |
| Zavar · **Részletek** — táblázat három rögzített sorral | 1. **Kihagyott megállók**: megállónevek listája, mindegyik két nyelven (a második nyelvű név hiányozhat, ha nincs) · 2. **Helyette**: egy mondat két nyelven · 3. **Következő frissítés**: egy időpont (óra:perc) | a sorok egyenként elhagyhatók; ha nem fér ki, a gép soronként a poszt szövegébe teszi (ez már rajzolva van) |
| Adatsávok · **Sávok** | 2–4 sor; soronként: címke két nyelven + egy szám (százalék, 0–100) | legalább 2, legfeljebb 4; a sáv hossza a számból jön |
| mindhárom · **Azonosító sor** | sorszám (egész szám) + dátum; a sorozatkód (INFO / DATE) és a járathivatkozás magától jön | a sorszámot az 1. körben **a munkatárs írja be** (számláló még nincs); a dátum alapból a mai nap |
| mindhárom · **Forrássor** | vagy „illusztratív adat” (pipa — a munkatér rögzített mondata kerül a képre), vagy a valódi forrás két nyelven | az Adatsávoknál kötelező; a Zavarnál és az Állításnál csak ha a képen ellenőrizetlen szám van |

## Amit visszakérünk
- A VZ-1b szerkesztő bal oszlopában ezeknek a mezőknek a rajza (asztali 1440 + telefon 390), a meglévő stílusban,
  mindegyiknél: üres · kitöltve · hibás (pl. rossz időformátum, 5. sáv) állapot.
- `feliratok.json` kiegészítés (`vz.` előtag, hu · ro · en). `kerdesek.md`, ha kell.
