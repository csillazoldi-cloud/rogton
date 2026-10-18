# R-3 · Saját fiók — átadó

2026-09-12 · Aitmetica SRL · a sorrend második tétele (R-2 → **R-3** → R-6 → R-4)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R3-sajat-fiok.dc.html`**. Egyetlen fájl, benne **öt artboard** (01–05).

**A megnyitásához hálózat kell** (a betűk a Google Fontsról), és a **`support.js` a rajz mellett kell** legyen — a csomag `rajz/` mappájában ott van. Ha a fájlt máshová emelitek, a `support.js`-t vigyétek vele.

A tokenkészlet az R-1 v4 `:root`-ja, szó szerint. **Új token nincs.**

## 1. Az öt artboard

| # | Mi | Méret |
|---|---|---|
| 01 | Alaphelyzet — három blokk (Adataim · Jelszó · Belépések) és a Munkatereim lista két munkatérrel, kétféle szereppel | asztali 1440 |
| 02 | Jelszóváltás — **A:** mentés közben · **B:** siker, a kiléptetett eszközök számával · **C:** ugyanez a válasz a „kiléptetés mindenhol” után | asztali 1440 |
| 03 | A három hibaút — üres név · rossz jelenlegi jelszó · túl rövid új jelszó | asztali 1440 |
| 04 | Kilépés egy munkatérből — alsó megerősítő sáv; a soron felül az utolsó tulajdonos zárt esete | asztali 1440 |
| 05 | Saját fiók — telefon, egy oszlop | telefon 390 |

## 2. Amit a rajz eldöntött

**A lap a sáv fiók-nevéből nyílik.** A név eddig az ügyfélprofilra vitt; mostantól a `/sajat-fiok`-ra. A 01-es és 04-es artboardon a név **kiemelt állapotban** áll a sávban, mert ez az aktív lap — a négy fő menüpont egyike sem aktív, hiszen ez a lap nem közéjük tartozik.

**A jelszóváltás következménye a gomb ELŐTT áll, nem utána.** A mentés gombja fölött figyelmeztető blokk mondja el, hogy a többi eszköz kilép, ez az egy marad. Ez a D-F19 döntés felületi következménye, és azért előre kerül, mert utólag már nem visszavonható.

**A siker megszámolja az eszközöket.** A válasz megmondja, hány munkamenet szűnt meg, és a rajz ezt ki is írja — „Két másik eszközről kiléptettük a fiókodat". A nulla eset is meg van fogalmazva, és **nem hiba**.

**A 10 karakteres követelmény a felületen dől el először.** A mentés gombja zárva marad, amíg rövid a jelszó, és a mondat is ott áll a mező alatt. A rajz jegyzete kimondja: a felületi zár kényelem, nem védelem — a végpont ettől függetlenül ellenőriz.

**Az e-mail-mező látszik, de zárt.** Szaggatott kerettel, halkabb szöveggel, és egy mondattal arról, hogy a rendszergazda írja át. Nem tüntetjük el: a felhasználó tudni akarja, melyik címmel lép be.

**A hibák a mező alatt állnak, nem a lap tetején.** Mind a három hibaútnál ott, ahol javítani kell. A hibát szöveg is jelzi, nem csak a keret színe.

**A rossz jelenlegi jelszó nem üríti az új jelszó mezőt.** A rajz ezt ki is írja, és hozzáteszi: a jelszó nem változott, és egyetlen eszköz sem lépett ki. Ez azért fontos, mert a felhasználó félhet attól, hogy egy félresikerült kísérlet is kiléptette a telefonjáról.

**A munkatérből kilépés megerősítése alsó sáv**, mint az R-2-ben — és megnevezi a következményt: visszajutni csak új meghívóval lehet.

**Az utolsó tulajdonos gombja zárt**, és mellette **két** mondat: a `UTOLSO_TULAJDONOS` szövege, plusz az, hogy mit tegyen — a Tagok lapon adjon tulajdonosi szerepet valaki másnak.

**A felület nyelve ide költözött** az ügyfélprofil oldalsávjából, és a mellette álló mondat elhatárolja a tartalomnyelvektől: azokat az ügyfélprofil mondja meg.

## 3. Halott vezérlő

| A rajzon | Végpont |
|---|---|
| Név mentése | `PUT /api/fiok/nev` |
| Jelszó megváltoztatása | `PUT /api/fiok/jelszo` |
| Kiléptetés minden más eszközről | `POST /api/fiok/kileptetes-mindenhol` |
| A felület nyelve | `POST /api/nyelv` |
| Munkatereim, utolsó belépésem, e-mail | `GET /api/fiok/en` |
| Kilépek (munkaterenként) | `POST /api/tagok/kilep` |

**Ami nincs a rajzon, mert nincs mögötte gépezet:** e-mail-cím módosítása, kétlépcsős belépés, profilkép, a belépések listája eszközönként (csak az **utolsó** belépés van), egyes munkamenet bontása, fiók törlése.

## 4. Feliratkulcsok

Új kulcsok: **`sajat.*`** (43), mind a három nyelven, a `feliratok.json`-ban.

A `meglevo_kulcsok` blokkban azok, amiket a rajz használ, de nem ő vezet be: `fiok.hiba_ervenytelen_adat`, `fiok.hiba_rossz_jelenlegi_jelszo`, `hozzaferes.hiba_utolso_tulajdonos`, a `nav.szerep_*` hármas és a `nav.sajat_fiok_sor`. **Ha a rendszerben más a szövegük, a rendszeré a hiteles** — a rajz csak a helyüket jelöli.

Egy kulcs a felületi ellenőrzéshez tartozik, tehát új: `sajat.jelszo_rovid` — ez nem végponti hibakód, hanem a felület saját mondata a 10 karakterről.


---

## v2 · 2026-09-13 — mi változott

A hiteles rajz mostantól **`R3-sajat-fiok v2.dc.html`**, benne **hat artboard**.

- Az **e-mail-cím** mezője megkapta az R-4-ben megtervezett **„még nem működik"** jelölést, és a mondat is cserélődött: a módosításhoz megerősítő levél kellene, ami még nincs a rendszerben; addig a rendszergazda állítja át. A jelölés vizuális nyelve (`--keszul` tokenek, szaggatott keret, kísérő mondat) az R-4 csomagból jön, szó szerint.
- A **Belépések** blokk a rövid listát kapta: mikor, honnan, sikeres-e — három sorral, köztük egy sikertelennel —, alatta a **30 napos megőrzés** mondata.
- **Új 2. artboard:** **A)** az egy munkateres eset (látszik, de nincs mire váltani) · **B)** a **rendszergazdai blokk** a négy gazdai lappal, mellette a jegyzet, hogy közönséges felhasználónál ez nem szürkén, hanem egyáltalán nem jelenik meg — és a **fiók törlésének** halk sora, gomb nélkül. A törlés szándékosan **nem** kap „még nem működik" jelölést: az a jelölés annak jár, ami készül.
- A lap alján **hivatkozás az R-4 Beállítások lapjára** (értesítések és adatpolitika), asztalon és telefonon is.
- A további artboardok eggyel arrébb csúsztak: jelszóváltás 3., hibaútak 4., kilépés egy munkatérből 5., telefon 6.

Új feliratkulcsok a `feliratok.json`-ban: `jelzes.meg_nem_mukodik`, `sajat.utolso_belepesek_cimke`, `sajat.belepes_sikeres`, `sajat.belepes_sikertelen`, `sajat.belepesek_megorzes`, `sajat.egy_munkater_megj`, `sajat.gazda_*`, `sajat.torles_megj`, `sajat.ertesitesek_*`, `nav.beallitasok`; a `sajat.email_megj` és `sajat.email_megj_rovid` szövege cserélődött.

Token: három új token (`--keszul`, `--keszul-bg`, `--keszul-border`) — **ugyanaz, mint az R-4-ben**, nem külön készlet.
