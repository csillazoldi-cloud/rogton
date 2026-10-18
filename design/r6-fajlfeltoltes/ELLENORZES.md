# Ellenőrzés — R-6 · Fájlfeltöltés az arculathoz (a Design csomagja, 2026-09-13 04:19-es fájlok)

Mérve az `atado/` csomagon (python a `feliratok.json`-on és a `.dc.html` törzsén; `_artboardok.mjs` a képekhez). Minden szám mérés.

## 1. Összegzés

**Hibátlan, beépíthető.** 6/6 artboard, 0 pixel-térköz, 51 kulcs három nyelven hiánytalanul; minden kattintható elem mögött létező végpont; a rajz a
mai gépezetet mutatja (10 MB, egy `logo` cél, Eltávolítás nincs). Egyetlen figyelmeztetés: a rajzon 22 beégetett színkód van — **mind a minta-logók
és a két háttér-próba (fehér, sötét) színe**, azaz ügyfélkreatív, nem a rendszer tokene; a megépítésben ezek a valódi képpel és két fix
háttér-próbával jelennek meg (`tokenőr: ok` megjegyzéssel), nem a téma színeivel — a szabály szerint az ügyfél logója a rendszer színeit nem örökli.

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **6/6** (01 üres blokk a profilon · 02 feltöltés A/B/C · 03 négy hibaút · 04 előnézet szabályai · 05 csere A/B · 06 telefon) |
| px-térköz a rajz törzsében | **0**; beégetett hex: 22 — mind minta-logó/háttér-próba (lásd 1.) |
| Feliratkulcsok | **51** (`arculat_fajl.*`), mind a három nyelven; a hibák mondatai a meglévő `fajl.hiba_*` kulcsokra mutatnak |
| Kulcs a rajzon, ami nincs a JSON-ban | csak az R-1 sávjának és a profil címének kulcsai (a rendszerben megvannak) |
| Végpont-megfelelés | POST feltöltés (fejléc: `x-fajl-nev`, `x-fajl-cel`), GET lista célonként, GET `{id}` megnyitás, Csere = új POST; a `logo_fajl_id` a tervezetben |
| A rajz megnyitása | hálózat kell (Google-betűk) + a `support.js` a rajz mellett — az átadó kimondja |

## 3. A Design kérdései — válaszok

| # | Kérdés | Válasz |
|---|---|---|
| 1 | Kell-e külön cél a sötét háttérre szánt logónak? | **Most nem.** A rajz megoldása (a logó két háttéren, kimondva, hogy külön fájlt nem tárolunk) igaz és elég; ha az ügyfeleknél gyakori a gond, ötödik cél (`logo_sotet`) — a TEENDŐ-listán, Vilmos szava. |
| 2 | Hány fájl lehet egy célon? | A gépezetben **nincs felső korlát**; a logónál egy van „használatban" (`logo_fajl_id`), a többi korábbi példány; a referenciáknál és a dokumentumoknál több is állhat. A feltöltő mező a cél alatt **marad** feltöltés után is (referencia, dokumentum) — ez a „még egy hozzáadása"; a logónál és a kézikönyvnél a Csere áll. Nem kell új artboard. |
| 3 | A kézikönyv és a dokumentum különbsége az AI-ban? | Ma az AI **nem olvassa** a feltöltött fájlokat — a tervezetet a szöveges profilból készíti; a négy cél a rendezés miatt van, az AI-felhasználás későbbi lépés. A rajz mondata jó. |
| 4 | Indul-e azonnali AI-feldolgozás a feltöltés után? | **Nem.** Csak az esemény íródik (`fajl_feltoltve`); állapotjelző és hetedik artboard nem kell. |
| 5 | Eltávolítás, két méretkorlát | egyezik a gépezettel: Eltávolítás nincs, egy korlát 10 MB. |

## 4. Döntések ebből (D-F31)

A feltöltés a **jelenlegi arculati tervezetbe** írja a logót (`logo_fajl_id`); ha a mai állapot jóváhagyott, a csere a rajz 05/A szerint **új tervezetet** nyit (a
meglévő állapotgép: a jóváhagyott szerkesztése új tervezet), és a korábbi jóváhagyott pillanatkép a régi fájlra hivatkozik — a listában „az N. jóváhagyott
tervezetben" jelöléssel, halványan, Megnyitással. PDF-nél képes előnézet nincs; **oldalszám sincs** (a gépezet nem méri — a rajz oldalszámot ír, az elmarad: típus és
méret áll). Az „Arculati anyagok" blokk **önálló komponens** (`ArculatAnyagok`), két helyen: az ügyfélprofil lapján saját kártyaként (01. artboard), és az onboarding
3. lépésén az arculat-blokkban.

## 5. Javaslat

**Beépíthető.** F-6b: az `ArculatAnyagok` komponens (feltöltés, lista, előnézet, hibák, csere, néző-nézet), a két hely bekötése, 0055 feliratok, próbák, képek.
