# Adatkötés — R-7c

| Felirat / érték | Honnan jön |
|---|---|
| 01–02 · a sorlista tartalma és a szerep szerinti sorok | `GET /api/gephaz` (tulajdonos: Csomag · Kimenő · Költség · Munkatér; rendszergazda: + Fiókok · Theme · Feliratok) |
| 01 · „Próbaidőszak — a Hírek modul…” | a csomag adata; **ár, fizetés, csomagváltás nincs** |
| 01 · Pénznem választó | munkatér pénzneme |
| 01 · „AI-keret: {összeg} maradt” | `/koltseg` havi keret és felhasznált, a munkatér pénznemében |
| 02 · árfolyam | rendszerszintű árfolyam-adat |
| 03 · a lista | Beállítások → Értesítések fül: a fiók utolsó 50 értesítése, olvasott/olvasatlan, megnyitás |
| 03 · hat kapcsoló | ugyanaz a fül: „miről szóljunk” + felületi csatorna |
| 04 · a három kérdés szövege, az adatút két sora | Adatpolitika fül (betűkészlet a Google-tól; AI-szolgáltató: OpenAI, felhő, USA) |
| 04 · AI-kapcsoló | `ai_kapcsolo` — működik, tulajdonosi jog |
| 05 · 25 esemény, 5 csoport, három szint, mentés | `/gephaz/kimeno`; a csatorna bekötve/nincs bekötve |
| 06 · logó | a feltöltött arculati logó (R-6, `POST /api/arculat/fajl`) |
| 06 · fő szín · világos/sötét · betűméret | Theme munkatér-szint; a betűméret a `--fs-base` három értéke; mentés = tervezet + alkalmazás egy műveletben |
| 07 · kulcsok, nyelvek, mentés | `/feliratok` — ~1500 kulcs, három nyelv, két szint |
| 08 · név, jelszó, kiléptetés, belépések (idő + IP), munkatereim, nyelv | `/sajat-fiok`; **böngésző/eszköz adat nincs a naplóban — nem rajzoltuk** |
| 09 · lista, meghívólink (7 nap), visszavonás, szerep, eltávolítás | `/tagok`; e-mail-küldés nincs |
| 10 · Alapadatok, Tartalmak stílusa, Arculat | a hiteles ügyfélprofil + az R-6 arculati anyagok |
