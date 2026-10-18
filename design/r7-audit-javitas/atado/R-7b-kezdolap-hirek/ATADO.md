# ATADO — R-7b · Kezdőlap és Hírek

Rajz: `rajz/R7b-kezdolap-hirek.dc.html` · tíz artboard. A menü a DÖNTÉS 3.1 A nevekkel: Kezdőlap · Hírek · Szervezet adatai · Beállítások (a Modulok lenyíló helyett közvetlen pont, mert egy modul van).

| # | Artboard | Mi épül | Állapotok / telefonos eltérés |
|---|---|---|---|
| 01 | Kezdőlap · profil nélkül 1440 | egy kártya egy mondattal + „Első beállítás” + súgó; nincs más csempe, nincs nulla | egy állapot |
| 02 | Kezdőlap · beállítva 1440 | lapcím + egy fő művelet; a Hírek csempe nagyban (idő, „{n} új”, 3 legfontosabb cím); keskeny üzemállapot-sor (oldalak · AI-keret · profil mentve) | a fő művelet a próba előtt „Próba indítása”; az arculat-csempe, a hívásszám és a gépidő elmarad |
| 03 | Kezdőlap 390 | egy oszlop, az üzemállapot összecsukható | — |
| 04 | Hírek · üres 1440 | két mondat + „Hírfigyelés beállítása”; a modul fülsora a sáv alatt | az AI-javaslat mondata csak ha valóban elkészült |
| 05 | Hírek · lista 1440 | kártya: magyar cím + eredeti halkan (DÖNTÉS 3.5 A) · kiadó · idő · forrás nyelve · 2–3 soros összefoglaló · egy indok-mondat · Mentés / Nem érdekel / Megnyitás; fent számmal jelzett AI-állapot sáv; alatta összecsukva „További helyi hírek ({n})” | a beállítás verziója nem a kártyán; a háttér-kategória a csukott részben |
| 06 | Hírek · részletpanel 1440 | panel a felső sáv fölött, saját fejléc (cím + Bezárás mindig látszik); „Részletes összefoglaló”; külön rövid indok; „forrás: román · összefoglaló: magyar”; semleges tartalomötlet-doboz; „Eredeti cikk megnyitása” | nincs narancs keret, nincs dőlt szedés, nincs posztvázlat-gomb |
| 07 | Hírek 390 | rövid fülnevek (Hírek · Beállítás · Precizare/Pontosítás), a panel teljes képernyő saját fejléccel | két artboard egymás mellett |
| 08 | Figyelés beállítása 1440 | egy oszlop: 1. témák (chip + „Hozzáadás”, × neve „Téma eltávolítása”) · 2. források (lista + hozzáadás; sorműveletek: állapot szóban + Újrapróbálás · Cím módosítása · Eltávolítás) · 3. Pontosítás csukva · saját név választógombbal; gombok a valódi sorrendben (mentés → próba → napi figyelés), a próba gomb egy mondattal mondja, miért nem aktív | AI-javaslat állapotai: készül · kész · nem sikerült + Újrapróbálás; kilépésnél figyelmeztetés a nem mentett változásra |
| 09 | Figyelés beállítása 390 | a fő gomb alul rögzítve | — |
| 10 | Találatok pontosítása 1440 | bevezető két mondat; kártya a 05 rövid alakja; negatív ok 4 chippel, kihagyható; haladásjelző + „Ugrás a javaslathoz”; javaslat-doboz (elfogad · kipróbál · elvet); üres állapotok forrással és forrás nélkül | a „nem sikerült” állapot ugyanabban a keretben, mondat + Újrapróbálás |

## Változott kulcsok
- `hf.kat_*` (változott) — „nem releváns” helyett „Nem érdekel”; a kategóriák: fontos · érdekes · háttér
- `hf.indok_cim` (változott) — az indoklás egy mondat, „Ezért lehet fontos neked:”
- `hf.proba_inditasa` (változott) — „Próbafuttatás” → „Próba indítása”
- `hf.ful_pontositas` (változott) — „Finomhangolás” → „Találatok pontosítása”
- `hf.ertekeles_keszul` (változott) — számmal, és nem hibaként az egész lista fölött
- új: `r7.tovabbi_helyi_hirek`, `hf.forras_cim_modositas`, `hf.forras_eltavolitas`, `hf.proba_miert_nem`, `hf.pontositas_ures_*`

## Telefon (390)
A fülek rövid nevekkel elférnek; a részletpanel teljes képernyő; a fő gomb a beállító lapon alul rögzített; vízszintes görgetés nincs.
