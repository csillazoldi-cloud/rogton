# R-16 · Arculat — logók, színek, betűk (12 Szervezet adatai)

Mi van a mappában:

| Fájl | Mi ez |
|---|---|
| `DESIGN-KERES-R16-ARCULAT.md` | A Design-kérés (magyar): miért, mit kérünk, a gépezet táblája. |
| `R16-arculat.dc.html` + `support.js` | A **jóváhagyott rajz** (Csilla, 2026-09-30 08:12): 12a 12b 12c 12d 12d2 12e 12f 12g, asztali 1440 + telefon 390. |
| `gepezet.md` | Ami a rajzhoz új adatot vagy viselkedést kér (1–13). |
| `kerdesek.md` | A döntések (mind eldöntve). |
| `feliratok.json` | A 84 felirat (`r16.arculat.*`), hu · ro · en. |
| `meres/` | A rajz mérése: `jelentes.md`, `jelentes.json`, képek (`kep/`). |
| `TERV.md` | **Az építési terv** (angol, fejlesztőknek): adatmodell, adatvesztési kockázatok, K1–K8 csomagok, modulhatárok, döntések. |

## A rajz mérése

```bash
python3 tools/tibor-proba/rajz_proba.py design/R16-arculat/R16-arculat.dc.html --ki design/R16-arculat/meres
python3 tools/tibor-biro/tibor_biro.py --ki design/R16-arculat/meres --max 3     # ahol az Ollama elérhető (Mac VM); ismételd, amíg 0/1-gyel lép ki
python3 tools/tibor-proba/zar.py --ki design/R16-arculat/meres --rajz           # NYITVA → kódolható
```

A rajz-próba 16/16 zöld (2026-09-30 08:07). A Tibor-bíráló még nem futott rajta — a `TERV.md` szerint ez a K1 előfeltétele.
A mérő a lap nevéből az ékezetes betűket kihagyja (`12b-ezt-talltuk`) — ez csak a fájlnév, a mérést nem érinti.

## Hol a terv

`TERV.md` — a csomagok sorrendje: K1 ∥ K2 → K3 → K4 ∥ K5 → K6 → K7; a feliratok (K8) a csomagokkal mennek, 0135–0139 migrációkban.
