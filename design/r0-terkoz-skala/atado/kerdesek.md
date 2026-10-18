# Kérdések és eltérések — R-0 · Térköz-skála

## 1. Eltérések a feladatlaptól

### 1.1 A kerekítési szabály: holtversenyben a **sűrűbb** fok felé

A feladatlap 3.1 pontja a lépcsőt megadja, a kerekítés szabályát nem — viszont felsorolja a
2 pixelnél nagyobb elmozdulásokat: 90→80, 70→80, 64→56, 60→56, 48→40, 36→32, 28→24.

Ezek közül a 48, a 36 és a 28 **pontosan két fok között van** (48: 40 és 56 közt; 36: 32 és 40
közt; 28: 24 és 32 közt), és a feladatlap mindháromnál a **kisebb** fokot választja. Ezért a
kulcsban is ez a szabály áll: *a legközelebbi fokra, holtversenyben a sűrűbb felé.*

Ennek van egy következménye a kis értékeknél: a 3px a `--ter-1`-re (2px) megy, nem a `--ter-2`-re
(4px); az 5px a `--ter-2`-re, a 7px a `--ter-3`-ra, a 9px a `--ter-4`-re. Vagyis **a felület
összességében egy hajszállal sűrűbb lesz**, nem levegősebb. Ha ezt nem így akarod — mert a
„levegősebb felé” kerekítés ugyanolyan védhető —, akkor a hét nagy elmozdulásból három
másfelé megy (48→56, 36→40, 28→32), és a mérleg négy száma is változik.
**Egy szó, és átszámolom.**

### 1.2 A nevezéktan: sorszám, nem érték

A feladatlap 4. pontja azt kéri, hogy *„a fok neve a méretét jelölje, ne a használatát”*, és
példaként a `--ter-0` … `--ter-13` formát adja. Ezt fogadtam el, tizenöt fokkal: `--ter-0` …
`--ter-14`.

Ahol döntenem kellett: a név lehetett volna **értéknév** is (`--ter-8` = 8px), ami a „méretét
jelölje” feltételt szó szerint teljesíti. Nem ezt választottam, mert ha a téma sűrűbb vagy
levegősebb lesz, az értéknév hazudna — és épp az a lap célja, hogy a sűrűség a Theme lapról
állítható legyen. A sorszám a lépcsőn elfoglalt helyet jelöli, ami szintén méret, csak
viszonylagos.

### 1.3 A skálát nem írtam át

A feladatlap felajánlja, hogy más lépcsőt javasoljak. Nem éltem vele: a javasolt skála a mért
eloszlásra van illesztve, a sűrű vége elég finom (2–4–6–8), és a négy átállási szám rá vonatkozik
— egy saját skála csak akkor lenne jobb, ha a mérést újra tudnám futtatni a mai kódon, amit nem
tudok (lásd 2.1).

Egyetlen apró megjegyzés: a 0-t **fokként** vettem fel (`--ter-0`), így a lépcső tizenöt fokos,
nem tizennégy. Indok: a „nincs köz” is döntés, és így a kódban sem marad csupasz `0`.
A tizenhatos korlát alatt vagyunk.

## 2. Nyitott kérdések

### 2.1 A mérés tíz napos

A számok — 1021 érték, 37 különböző, 790/179/34/18 — a 2026-09-01-i mappamásolatból származnak.
A javítás előtt a mérést le kell futtatni a **mai** kódon, különben a Theme-lap használati
számlálói és a tizennyolcas lista pontatlan lesz. Ez nem rajzkérdés, de az átadóhoz tartozik:
**a rajz a számokat adatként kezeli, nem égeti be.**

### 2.2 A használati számláló megépítése

Ez a lap egyetlen új gépezete: „`--ter-4` · 248 helyen”. Két út van — építéskor számolt szám,
vagy a mérés eredményének tárolása a token-táblában. **Ha egyik sem éri meg**, a szám elhagyható,
de akkor a feladatlap 6. pontjának harmadik kérése („látszódjon, melyik fokot hány helyen
használjuk, így nem hal el észrevétlenül egy fok”) nem teljesül. Melyiket választjuk?

### 2.3 Két új színtoken a fok-jelöléshez

A Theme-lapon a köz rajzát egy vonal mutatja, a rajzon pedig kék bélyegek jelölik a fokokat.
Ehhez két származtatott színtokent vettem fel (`--ter-jel`, `--ter-jel-bg`). Ha nem akarsz két
új tokent, a meglévő `--src-web` és `--src-web-bg` is megteszi — akkor viszont a fok-jelölés
pont úgy néz ki, mint a „web forrás” jelvény a hírfigyelőn. **Új token, vagy meglévő szín?**

### 2.4 A monotonitás ellenőrzése

Javaslom, hogy a Theme-lap ne engedje egy fokot a következőnél nagyobbra állítani: egy
felcserélt fok az egész felületet szétszórja. Ez a rajzon nem látszik (nincs hibaút megrajzolva
rá), mert nem szerepelt az artboardok közt. **Ha kell a hibaút, megrajzolom** — egy sor a
csoport alatt, és a mező piros kerete.

### 2.5 Mi történik a 18 hellyel — egyszerre vagy külön?

Javaslom a sorrendet: először a `--pad-card` (36→32), mert egy token átírása egyszerre javítja a
legtöbb helyet, és rögtön látszik, elfogadható-e. A többi tizenhét utána gépies.
**Ha egyszerre kell mind, az is mehet** — de akkor egy szem kell rá, hogy a nagy lapok
függőleges ritmusa nem borul-e.

## 3. Amit nem tudtam megcsinálni

### 3.1 A mérést nem tudtam újrafutni

A 2. pont számait a feladatlapból vettem át. Ellenőrizni nem tudtam: a csatolt mappa a
2026-09-01-i állapot, és a rajz készítése közben nem futtattam rá új számolást.
**A számok tehát a te mérésed, nem az enyém** — ezt a rajz és az átadó is így jelöli.

### 3.2 A fokonkénti előfordulás-számok becsültek

A használati számlálók (67 · 61 · 110 · 248 · 143 · 90 · 90 · 69 · 26 · 33 · 10 · 8 · 6 · 4)
a feladatlap tizenöt gyakori értékéből, az átállási kulcs szerint összegezve készültek.
A 37 érték közül **húsznak nem ismerem az előfordulását** (a feladatlap szerint együtt is
kevesebb, mint 60), ezért a fokonkénti számok összege ~924, nem 1021. A maradék ~97 a nem
részletezett értékek közt oszlik el, és a 2.1 szerinti újramérés fogja pontosítani.
**A rajz ezeket adatként kezeli, tehát az újramérés után egy helyen kell átírni őket.**

### 3.3 Egy pixelérték szándékosan a rajzon maradt

A 3. artboard bal oldali részletén a mai pixelszámok állnak. Ez nem hiba: nélküle nem lenne mit
összehasonlítani. A felirat kimondja, hogy ez a rajz egyetlen ilyen helye.
