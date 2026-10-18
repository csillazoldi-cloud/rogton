# Design-kérés — VZ-1 · Vizuálgyártó: a szerkesztő (1. kör)

2026-09-23 · Aitmetica SRL · Írta: a fejlesztő oldal (Claude), Vilmos kérésére.
**Ezt a lapot egészben, változtatás nélkül add át a Claude Designnak.** A tokenlap: `design/semak/semak.css`;
a felső sáv és a lapkeret az R-12 szerint. A modul teljes leírása: `docs/vizualgyarto/` (különösen `szerkeszto.md`).

---

## 0. Mi ez, és miért

A munkatér új modulja: **a munkatárs kitölt egy sablont két nyelven, és kész közösségi médiás képet kap**, a saját
cége arculatában. A sablon nem rajz, hanem recept; a betűt, színt, logót a munkatér arculata adja.

Az **1. kör** egyetlen dolgot bizonyít: **amit a szerkesztő a képernyőn mutat, az képpontra ugyanaz, mint amit letölt.**
Ezért az előnézet NEM a böngészőben élőben rajzolt kép, hanem **a gép által elkészített kép** (ugyanaz a fájl, amit a
letöltés ad) — mérve 2026-09-23: két külön indított böngésző a képpontok ~5%-ában eltér, ugyanaz a kirajzoló 0%-ban.
A gép egy képet ~1–3 másodperc alatt készít el; a rajz ezt a várakozást is mutassa.

A képalkotó gépezet kész és a teszten látható: `/allapot/kepek/vizual/`, `/vizual2/`, `/vizual3/`.
**A képernyőt csak a rajz után építjük.** Ami a rajzon nincs, az nem kerül a képernyőre; ami többlet, az hiba.

## 1. Szabályok — ugyanazok, mint eddig

- Csak tokenből (`design/semak/semak.css`, mindhárom séma). Új tokent a `tokenek.md`-ben indokolj.
- Minden szöveg feliratkulcsból, három nyelven (hu · ro · en), a `feliratok.json`-ban; előtag: `vz.`.
- **Halott vezérlő tilos** — csak az rajzolható, aminek a 2. pontban gépezete van.
- Asztali 1440 és telefon 390, vízszintes görgetés nélkül.
- Egyszerű magyar. **Nem szerepelhet:** recept, token, render, px a munkatársnak — a szavak: **sablon**, **kép**,
  **betűméret**, **kifér / nem fér ki**.
- Egy fő művelet lapon: **Letöltés**.

## 2. A gépezet — ebből rajzolhatsz

| Mi | Honnan |
|---|---|
| **3 sablon**: Zavar (forgalmi közlemény), Állítás (egy mondat), Adatsávok (arányok 2–4 sávval). Mindegyiknek a mezői, címkéje, súgója, kötelező-e, van-e rövid változata. | a sablon adataiból |
| **A kép** a beírt szövegből, a munkatér arculatával, 1080×1350. Egy elkészítés ~1–3 mp. | a képgyártó |
| **Mezőnként**: hány sorban áll nyelvenként, és a megengedett legtöbb (pl. „2 sor a legfeljebb 3-ból”); melyik betűméret-lépcsőn áll (4 lépcső: nagy · közepes · kisebb · legkisebb); kifér-e. | a mérés |
| **„Mit tett a gép”**: a lépések sorban — kisebb betűméret · keskenyebb betű a táblázatban · a rövid változat · egy sor a poszt szövegébe került. | az illesztés |
| **Nem fér ki**: melyik mező, mennyivel (sorok vagy a lap alja). Ilyenkor a letöltés tiltva. | az illesztés |
| **Szabályjelzések**: tiltás (a letöltést tiltja) vagy figyelmeztetés (csak szól); mindegyiknél: a szabály neve, a mező, a mért érték és a határ. | a szabályellenőrző |
| **A poszt szövegébe került sorok** (két nyelven) — ezeket a munkatárs a kép mellé másolja. | az illesztés |
| **Letöltés**: a kép PNG-ként, és a poszt szövegébe került sorok szövegként (másolható). | a képgyártó |

**Mit NE rajzolj (nincs mögötte gépezet az 1. körben):** fotó és képtár; a „legutóbbi 9 poszt” rács; több formátum
(csak 1080×1350 van); mentés, piszkozat, változatok; sorszám-számláló (a sorszámot most a munkatárs írja be);
„Elfogadom” gomb és napló; második ellenőrző (Vilmos döntése: nincs); arculat szerkesztése; posztolás; gépi fordítás
(a második nyelvet a munkatárs írja — szándékos).

## 3. A lapok

### VZ-1a · Sablonválasztás
- A három sablon egy-egy kis mintaképpel **a munkatér saját arculatában** (a gép elkészíti), egy sor magyarázattal.
- Kattintásra a szerkesztő nyílik a sablonnal.

### VZ-1b · Szerkesztő
- Bal oldalt az űrlap, jobb oldalt a kép. **Minden szövegmező kétszer**: első nyelv, alatta második nyelv, azonos
  címkével. Csak a sablon mezői látszanak.
- Mezőnként alatta a **kiférés-sáv**: „2 sor a legfeljebb 3-ból · közepes betűméret”, színe zöld (semmit nem kellett
  tenni) · sárga (a gép lépett — mit) · piros (nem fér ki, át kell írni). Rövid változat adható, ahol a sablon engedi.
- A sávra kattintva: **„Mit tett a gép”** panel a lépésekkel.
- A kép fölött/alatt az állapot: „A kép készül…” (1–3 mp) · kész · hiba. Beírás közben a kép a gépelés
  befejezése után frissül (a régi kép addig halványan látszik, felirattal).
- **Jelzések** blokk: tiltások és figyelmeztetések listája, a mezőre ugrással.
- **„A poszt szövegébe”** blokk, ha a gép sort költöztetett (két nyelven, másolás gombbal).
- **Letöltés** gomb: tiltásnál szürke, rámutatva megmondja, miért.

### Állapotok (mindkét lapon, asztali + telefon)
1. Üres sablon (első megnyitás) · 2. Kitöltve, minden kifér (zöld) · 3. A gép lépett (sárga, a panel nyitva) ·
4. Nem fér ki (piros, letöltés tiltva) · 5. Szabálytiltás (letöltés tiltva) · 6. A kép készül · 7. A képgyártó nem
válaszol (hiba, „Újra”).

## 4. Amit visszakérünk

- A két lap `.dc.html`-ként, asztali + telefon, a hét állapottal.
- `feliratok.json` (hu · ro · en) az új `vz.` kulcsokkal.
- `kerdesek.md`, ha valamihez nincs gépezet, vagy döntés kell Vilmostól.
