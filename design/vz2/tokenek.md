# Tokenek — VZ-2

A `design/semak/semak.css` nincs ebben a projektben. A rajz a **Világos** séma R-12b értékeivel áll (a VZ-1 sötétben volt). Éjkék és Sötét sémára ugyanezek a tokennevek érvényesek.

## Új felületi tokenek
| Token | Világos | Mire | Miért |
|---|---|---|---|
| `--valaszto-aktiv-bg` | `--primary` 10% fehéren | a kiválasztott méret gomb („Hová kerül?”) háttere | a szegmentált választó eddig nem volt a rendszerben; a navigáció aktív jelölése (aláhúzás) itt nem értelmes |
| `--valaszto-aktiv-border` | `var(--primary)` | ugyanannak a kerete | |

A `--kapcsolo-w/-h` (R-4) a „Román változat is” kapcsolóé.

## A kép tokenjei — nem felület
A képen minden szín, betű és logó **a munkatér arculatából** jön (`vz2-kep.js` → `CEGEK`). A rajzon három példa:
| | fő szín | háttér | szöveg | betű |
|---|---|---|---|---|
| Kövesi Térkő | #2f5d50 | #f1ede4 | #1f2421 | Archivo |
| Piroska Pékség | #b4532a | #fbf1e2 | #3a2419 | Public Sans |
| semleges (arculat nélkül) | #2b2e36 | #f4f4f2 | #1d1f24 | Public Sans |

A semleges alap **rendszer-token** kell legyen (`--kep-semleges-fo`, `--kep-semleges-hatter`, `--kep-semleges-szoveg`), mert ezt minden munkatér kapja, akinek nincs arculata. Idegen cég márkája soha.

Az „Újdonság” képen a fotó alján sötétedés van (átlátszó → 72% fekete) — ez a kép része, nem felületi gradiens.
