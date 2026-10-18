# Tokenek — VZ-1

A `design/semak/semak.css` a fejlesztő oldal tárolójában van, ebbe a projektbe nem került át. A rajz az R-7e / R-12 tokenneveivel áll (sötét séma), ugyanazokkal az értékekkel. A világos sémára az R-12b értékei érvényesek.

## Új tokenek

| Token | Alapérték (sötét) | Világos | Mire | Miért |
|---|---|---|---|---|
| `--illesztve` | #e6c065 | #8a6a12 | a kiférés-sáv sárga állapota: „a gép lépett” | a brief kifejezetten sárgát kér, és ez nem figyelmeztetés (az a narancs `--warn`), hanem tájékoztatás. Ha a narancsot használnánk, a sárga sáv és a szabály-figyelmeztetés ugyanúgy nézne ki |
| `--illesztve-bg` | `--illesztve` 12% | 12% | a sáv háttere | |
| `--illesztve-border` | `--illesztve` 32% | 32% | a sáv kerete | |
| `--kep-bg`, `--kep-text`, `--kep-sav` | #f4f2ee · #15171f · `--primary` | ua. | **csak a rajz vázlatképe** — a valódi képet a gép a munkatér arculatából rajzolja; a felület nem használja | a vázlatnak látszania kell, hogy kép, nem felületelem |

## A zöld · sárga · piros jelentése
- zöld `--ok`: semmit nem kellett tenni
- sárga `--illesztve`: a gép lépett, a lépések a „Mit tett a gép” panelen
- piros `--err`: nem fér ki, a letöltés tiltva
- a szabály-**figyelmeztetés** narancs (`--warn`), a **tiltás** piros (`--err`) — mindkettő a Jelzések blokkban, szóval is jelölve
