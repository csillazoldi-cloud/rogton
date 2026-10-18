# ATADO — R-7c · Beállítások-szint

Rajz: `rajz/R7c-beallitasok.dc.html` · tizenegy artboard.

| # | Artboard | Mi épül |
|---|---|---|
| 01 | Beállítások · tulajdonos 1440 | sorlista öt csoportban (Szervezet · Csapattagok · Megjelenés · Használat · Haladó); minden sor: név · egy mondat a következményről · „→”. Az „Ami itt nincs” blokk és a token-számok elmaradnak |
| 02 | Beállítások · rendszergazda 1440 | + Rendszer csoport (Fiókok · közös alap Megjelenése · közös Felület szövegei · árfolyam); a tulajdonosi csoportok változatlanul |
| 03 | Értesítések 1440 | fent a lista (idő · egy mondat emberi nyelven · teendő-gomb, ha van), üres állapot egy sor; alatta külön „Értesítési beállítások” a hat kapcsolóval, a szótár mondataival |
| 04 | Adatkezelés 1440 | három kérdés semleges panelben (Mit küldünk tovább? · Kinek? · Mire használja?); az AI-kapcsoló a következménnyel; a betűkészlet sora |
| 05 | Kapcsolat más rendszerekkel 1440 | üres állapot elöl, a 25 esemény listája alatta összecsukva; a soron egy vezérlő (Alapbeállítás · Bekapcsolva · Kikapcsolva) + az érvényes rövid jele; belső nevek nincsenek |
| 06 | Megjelenés · egyszerű nézet 1440 | logó · fő szín · világos/sötét · betűméret (a `--fs-base` három értéke) · élő előnézet; egy fő gomb; „Haladó beállítások” a mai hat füles lapra |
| 07 | Felület szövegei 1440 | a kiválasztott nyelv nyitva, a másik kettő fülön; a technikai kulcs halkan, másodlagos; emberi csoportnevek; „Szövegek mentése a szervezetnél” |
| 08 | Saját fiók 1440 | 1–2 oszlop, három rész (Adataim · Biztonság · Szervezeteim); belépések „Ma, 14:18” + IP részletként; e-mail sora egy mondattal |
| 09 | Csapattagok 1440 | a Beállítások → Csapattagok sorból; szerepleírások; párbeszéd „Meghívólink létrehozása”, mező „Név vagy megjegyzés — nem kötelező” |
| 10 | Szervezet adatai 1440 | Alapadatok · Tartalmak stílusa · Arculat (ide költözik az onboarding 3. lépésének arculat-blokkja és az R-6 anyagok, változatlan tartalommal); „Arculat beállítása” másodlagos gomb; a piszkozat-magyarázat helyett egy következmény-mondat |
| 11 | Beállítások és Megjelenés 390 | a sorlista és az egyszerű nézet telefonon, a fő gomb alul rögzítve |

## DÖNTÉS 3.3 (A) hatása ezen a lapon
Nem látszik a tulajdonos nézetén: az e-mail és telefon csatorna doboza (03), a felhő-kapcsoló (04), az e-mail-cím módosításának jelölt doboza (08 — helyette egy mondat). A rendszergazda nézetén ezek megmaradnak, az R-4 jelölés-nyelvével (`--keszul-*`, `jelzes.meg_nem_mukodik`).

## Változott kulcsok
- `gephaz.cim` (változott) — „Gépház” → „Beállítások”
- `tema.cim` (változott) — „Theme-beállítások” → „Megjelenés”
- `feliratok.cim` (változott) — „Feliratok” → „Felület szövegei”
- `kimeno.cim` (változott) — „Kimenő értesítések” → „Kapcsolat más rendszerekkel”
- `beallitasok.adatkezeles_cim` (változott) — „Adatpolitika” → „Adatkezelés”
- `tagok.cim` (változott) — „Tagok” → „Csapattagok”; `tagok.meghivo_gomb` — „Meghívó kiadása” → „Meghívólink létrehozása”
- `fiok.szervezet_cim` (változott) — „Ügyfélprofil” → „Szervezet adatai”
- `esemeny.*_cim` (változott) — emberi mondatok a szótár szerint
- új: `gephaz.csoport_*`, `*.kov` következmény-mondatok, `r7.*` üres állapotok
