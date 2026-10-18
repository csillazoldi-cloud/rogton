# Tokenek — VZ-3

Új felületi token **nem kell**. A választó a VZ-2 méretválasztójának tokenjeiből él:
| Token | Mire |
|---|---|
| `--valaszto-aktiv-bg` | a kiválasztott mintakép gombjának háttere |
| `--valaszto-aktiv-border` | a keret (itt 2 px — a kis mintakép körül az 1 px nem látszik) |
| `--r-btn`, `--fs-xs`, `--ter-2…4` | a gomb, a felirat, a térközök |

## A kép színei — nem tokenek
A munkatér arculatából jönnek (fő szín · második szín · háttér · szöveg). A gép számítja belőlük:
| Érték | Szabály |
|---|---|
| a Sötét háttér | fő szín × 0,55 (csatornánként) |
| szöveg a kiemelő dobozon | fehér vagy az arculat sötét szövegszíne, amelyik olvashatóbb |
| szöveg a Színes háttéren | ugyanígy |
| határok | 4,5 kis szöveg · 3 nagy szöveg és vonal (WCAG AA) |

Ezeket a gép receptjében kell rögzíteni, nem a felület tokenjei között.
