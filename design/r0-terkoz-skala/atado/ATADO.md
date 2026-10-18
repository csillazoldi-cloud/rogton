# ATADO — R-0 · Térköz-skála

2026-09-11 · Aitmetica SRL · a `FELADATLAP.md` aznapi változata szerint.

## 0. Melyik fájl a hiteles

| Fájl | Mi ez |
|---|---|
| `rajz/r0-terkoz-skala.dc.html` | **A hiteles rajz.** Egyetlen fájl, mind az öt artboarddal, külső css, js és kép nélkül; böngészőben megnyitva magától megjelenik. |

Nincs második változat. Egyetlen külső hivatkozás van benne, a betűkészlet
(`fonts.googleapis.com`) — **hálózat nélkül is megjelenik**, akkor a rendszer betűivel; a
szerkezet, a méretek és a térközök változatlanok. A betűket nem ágyaztam be: a fájl méretét
megtöbbszörözné, és a valódi lapon is a Google-tól jönnek (ez egyébként nyitott tétel az R-4
adatpolitika lapján).

A rajz **vászon módban** van (`design_doc_mode=canvas`), tehát szabadon pásztázható és
nagyítható. Az öt artboard egymás alatt áll, a feladatlap 7. pontja szerinti sorrendben és
névvel.

## 1. A skála

Tizenöt fok, a mért eloszlásra illesztve. A feladatlap 3.1 pontjának lépcsőjét fogadtam el:
mérésből jött, nem ízlésből, és a négy átállási szám rá vonatkozik. Nem írtam át.

| Fok | Név | Érték | Mire való |
|---|---|---|---|
| 0 | `--ter-0` | 0px | nincs köz — visszaállítás, összeérő elemek |
| 1 | `--ter-1` | 2px | jelvény belseje, pötty melletti köz |
| 2 | `--ter-2` | 4px | címke és érték, ikon melletti köz |
| 3 | `--ter-3` | 6px | jelvény vízszintes tere, apró sorköz |
| 4 | `--ter-4` | 8px | elemek közt egy soron, jelvénysor — **a leggyakoribb köz** |
| 5 | `--ter-5` | 10px | lista sorai, kártyán belüli sorok, gombok közt |
| 6 | `--ter-6` | 12px | űrlapmezők közt, mezőbelső függőlegesen, gombbelső függőlegesen |
| 7 | `--ter-7` | 14px | csempék közti köz, mezőbelső vízszintesen |
| 8 | `--ter-8` | 16px | csempe belseje, telefon lapmargó |
| 9 | `--ter-9` | 20px | nagy panel belseje |
| 10 | `--ter-10` | 24px | lapmargó, gomb vízszintes tere |
| 11 | `--ter-11` | 32px | üvegkártya belseje |
| 12 | `--ter-12` | 40px | rajzvászon margója, nagy szakaszköz |
| 13 | `--ter-13` | 56px | szakaszok, artboardok közt |
| 14 | `--ter-14` | 80px | a lépcső teteje — nyitóképernyő-szerű nagy levegő |

**A lépcső zárt.** A sűrű vég (2–8) négy fokot kap, mert a mért térközök kétharmada ide esik;
24 fölött összesen húsz előfordulás van, oda négy fok elég. Tizenöt fok, a feladatlap szerinti
tizenhatos korlát alatt.

### 1.1 A nevezéktan és a három feltétel

`--ter-0` … `--ter-14`. Rövid (7–8 karakter), a `ter` a térköz rövidítése.

1. **A fok neve a méretét jelöli, nem a használatát.** A sorszám a lépcsőn elfoglalt helye.
2. **A mai nevek nem szűnnek meg**, hanem a skálára mutatnak (2. pont) — egy sor kód sem törik el.
3. **Rövid**, mert 1021 helyen fog szerepelni.

**Miért sorszám, és nem érték** (`--ter-8` = 8px helyett): ha a téma sűrűbb vagy levegősebb lesz,
a lépcső egésze mozdul, és az értéknevek hazudnának. A sorszámozott név a sűrűség állításakor is
érvényes marad — és épp ez a lap egyik célja: a sűrűséget a Theme lapról lehessen állítani.

## 2. A mai tokenek a skálára mutatnak

```css
--gap:           var(--ter-6);   /* 12px → 12px  ·  nem változik   */
--pad-card:      var(--ter-11);  /* 36px → 32px  ·  −4px           */
--pad-block:     var(--ter-9);   /* 22px → 20px  ·  −2px           */
--pad-field-y:   var(--ter-6);   /* 13px → 12px  ·  −1px           */
--pad-field-x:   var(--ter-7);   /* 15px → 14px  ·  −1px           */
--btn-pad-y:     var(--ter-6);   /* 13px → 12px  ·  −1px           */
--btn-pad-x:     var(--ter-10);  /* 26px → 24px  ·  −2px           */
```

Az R-1-ben kért négy méret-token közül három szintén térköz, tehát ezek is a skálára mutatnak:

```css
--gap-tile:      var(--ter-7);   /* 14px → 14px  ·  nem változik   */
--pad-tile:      var(--ter-8);   /* 18px → 16px  ·  −2px           */
--pad-row-y:     var(--ter-7);   /* 14px → 14px  ·  nem változik   */
```

A negyedik, a `--tile-min` (300px) **nem térköz**, hanem egy rács hasábjának minimális
szélessége — marad önálló token. Ugyanígy marad a `--fs-metric` (30px, betűméret) és a
`--control-min` (44px, vezérlőmagasság).

## 3. Az átállási kulcs — minden mai érték melyik fokra megy

**A szabály egy sor:** a legközelebbi fokra, holtversenyben a **sűrűbb** (kisebb) fok felé.
Ez a szabály adja ki a feladatlap 3.1 pontjában felsorolt hét nagy elmozdulást is
(90→80, 70→80, 64→56, 60→56, 48→40, 36→32, 28→24) — ezért ezt választottam, és nem a
„holtversenyben felfelé” szabályt.

A teljes kulcs, 1-től 90-ig. Amelyik érték szerepel a mérésben, ott az előfordulás is ott áll.

| Mai érték (px) | Fok | Elmozdulás |
|---|---|---|
| 1 · 2 (48×) · 3 (19×) | `--ter-1` (2px) | 1 · 0 · −1 |
| 4 (61×) · 5 | `--ter-2` (4px) | 0 · −1 |
| 6 (54×) · 7 (56×) | `--ter-3` (6px) | 0 · −1 |
| 8 (198×) · 9 (50×) | `--ter-4` (8px) | 0 · −1 |
| 10 (143×) · 11 | `--ter-5` (10px) | 0 · −1 |
| 12 (90×) · 13 | `--ter-6` (12px) | 0 · −1 |
| 14 (90×) · 15 | `--ter-7` (14px) | 0 · −1 |
| 16 (51×) · 17 · 18 (18×) | `--ter-8` (16px) | 0 · −1 · −2 |
| 19 · 20 (13×) · 21 · 22 (13×) | `--ter-9` (20px) | +1 · 0 · −1 · −2 |
| 23 · 24 (31×) · 25 · 26 · 27 · 28 | `--ter-10` (24px) | +1 · 0 · −1 · −2 · **−3** · **−4** |
| 29 · 30 · 31 · 32 · 33 · 34 · 35 · 36 | `--ter-11` (32px) | +3 · +2 · +1 · 0 · −1 · −2 · **−3** · **−4** |
| 37 … 48 | `--ter-12` (40px) | +3 … **−8** |
| 49 … 67 | `--ter-13` (56px) | **+7** … **−11** |
| 68 … 90 | `--ter-14` (80px) | **+12** … **−10** |

A vastagon szedett elmozdulások a 2 pixelnél nagyobbak — ezek a 4. pont tizennyolc helye.
A 27, 35, 45 és hasonló értékek a kulcsban azért szerepelnek, hogy a kód átírása **gépies
munka legyen, ne ítélkezés**: ha egy ilyen érték előkerül, a kulcs megmondja, hova megy.

### 3.1 Az átállás mérlege

| Mi történik | Hány helyen |
|---|---|
| pontosan a skálára esik, nem változik semmi | **790** |
| 1 pixelt mozdul — szabad szemmel nem látszik | 179 |
| 2 pixelt mozdul | 34 |
| 2 pixelnél többet mozdul | **18** |

**Az átállás 96%-ban nem változtat semmit a képernyőn.** A meglévő lapokat nem rajzoljuk újra —
csak a nevükön nevezzük az értékeket.

## 4. Ahol a kép 2 pixelnél többet változik — a 18 hely

A feladatlap hét érték-fajtát nevez meg; a tizennyolc előfordulás ezek között oszlik el.
A **melyik fájl** oszlop a 2026-09-01-i mappamásolatból származik, tehát fájlszinten pontos,
sorszinten nem — ezért a javításnál mindegyiket meg kell nézni, nem vakon átírni.

| Mai érték | Fok | Elmozdulás | Hol |
|---|---|---|---|
| 90px | `--ter-14` (80px) | −10 | `_kozos/fiok.css` — a fiók-lap nagy szakaszközei |
| 70px | `--ter-14` (80px) | +10 | `_kozos/fiok.css` — a lap alsó levegője |
| 64px | `--ter-13` (56px) | −8 | `tema/tema.css` — a Theme-lap csoportjai közt |
| 60px | `--ter-13` (56px) | −4 | `_kozos/fiok.css`, `hirfigyelo/attekintes.css` |
| 48px | `--ter-12` (40px) | −8 | `_kozos/fiok.css`, `hirfigyelo/beallitas.css` — kártyák közt |
| 36px | `--ter-11` (32px) | −4 | `_kozos/fiok.css` — az üvegkártya belseje (`--pad-card`) |
| 28px | `--ter-10` (24px) | −4 | `hirfigyelo/finomhangolas.css`, `feliratok/feliratok.css` |

**Amit ezekről tudni kell:** mind a tizennyolc **nagy térköz** — szakaszok, kártyák és
lapszélek közti levegő. Egyik sem sűrű köz, tehát egyik sem hozza közelebb egymáshoz a
szövegeket: a szöveg olvashatósága nem változik. A látható hatás annyi, hogy néhány lap
függőlegesen 10–40 pixellel rövidebb lesz.

**Javaslat a sorrendre:** először a `--pad-card` (36→32), mert egy token átírása egyszerre
javítja a legtöbb helyet, és rögtön látszik, hogy elfogadható-e az eredmény. Ha igen, a többi
tizenhét gépies.

## 5. Ami a Theme-beállítások lapon változik (4. artboard)

A lap ma 53 tokent mutat. A tizenöt fokkal **68 token** lesz, ezért a lap csoportokat kap:
Szín · Betű · Betűméret · Forma · **Térköz** · Egyéb.

A térköz-csoport a 6. pont három kérése szerint:
- a fokok **a lépcső sorrendjében**, egymás alatt;
- minden fok mellett **látszik a köz maga** — nem csak a szám, hanem egy vonal, ami pontosan
  olyan széles, amekkora a fok;
- és látszik, hogy **hány helyen használjuk** a fokot, így nem hal el észrevétlenül egyik sem.

A `--ter-0` mezője zárt: a térköz hiánya nem állítható érték. **Fok nem vehető fel és nem
törölhető** — a skála zárt; ha más érték kell, az a lépcső hibája, és akkor ez a lista változik.

A megerősítő sáv a **lap aljára rögzül**, nem a csoport aljára (E-50 tanulsága).

## 6. Telefonon (5. artboard) — mi marad el, mi tör sorba

- **Nem marad el semmi, és nincs külön telefonos skála.** A lépcső ugyanaz, egyetlen fok
  értéke sem változik.
- **Ami változik, az a fokválasztás:** a lap margója `--ter-10` → `--ter-8`, a kártya belseje
  `--ter-9` → `--ter-7`. A kártyák közti köz (`--ter-7`) változatlan.
- **A sűrű vég — `--ter-1`-től `--ter-5`-ig — telefonon sem mozdul:** a sorok és a jelvények
  közei ugyanazok, különben a szöveg összeszaladna.
- **Sorba tör:** a skála táblázata címke–érték–vonal hármasokká; a Theme-lap négyhasábos
  szerkesztősora egy hasábba.
- **Amit a skála nem érint:** az érintőméret. Minden gomb és lenyíló-sor `--control-min`
  (44px) magas marad — a gomb *belsejét* a skála adja, a *magasságát* a vezérlő-token.

## 7. Feliratok

Minden látható szöveg felirat-kulcsból jön, három nyelven (magyar · román · angol), az alapnyelv
az angol. A teljes lista a `feliratok.json`-ban van, **kivétel nélkül** — beleértve a
táblázatfejeket, a fokok „mire való” szövegeit és a rajz saját jegyzeteit is (utóbbiak külön
csoportban, mert nem kerülnek a termékbe).

A fokok **nevei és pixelértékei nem feliratok, hanem adat**: a skála maga. Ugyanígy adat a
használati számláló („248 helyen”).

## 8. Amit ez a rajz megépítésre kötelez

| Elem | Mi kell mögé |
|---|---|
| a tizenöt fok | tizenöt új token a token-táblában, a Theme-lap szerkesztőjével |
| a mai hét térköz-token | átírás `var(--ter-*)`-ra a `szarmaztat()`-ban |
| 1021 pixelérték a stíluslapokban | gépies átírás a 3. pont kulcsa szerint |
| „248 helyen” számláló | **használat-számolás**: a kód átvizsgálása fokonként, és a szám tárolása vagy építéskori előállítása |
| a köz rajza a Theme-lapon | a fok értékéből számolt vonal — nincs mögötte új adat |

A **használat-számláló** az egyetlen valóban új gépezet ezen a lapon. Ha ez sok, a szám
elhagyható, de akkor a 6. pont harmadik kérése („ne haljon el észrevétlenül egy fok”) nem
teljesül — lásd `kerdesek.md`.
