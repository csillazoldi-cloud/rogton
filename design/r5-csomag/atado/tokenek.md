# Tokenek — R-5

**Új token nem kell.** A rajz az R-1 v4 `:root`-jából és az R-4 hat tokenjéből épül:

| Token | Hol használja az R-5 |
|---|---|
| `--keszul`, `--keszul-bg`, `--keszul-border` | az „Árazás és fizetés" jelölt sor a Csomag csempén; a felhő-kapcsoló doboza (R-4-ből) |
| `--kapcsolo-w`, `--kapcsolo-h` | az AI-kapcsoló és a közös alap kapcsolói a 04. artboardon |
| `--olvasatlan` | nem használja (az R-4 értesítéslistájáé) |

A többi: `--ok` / `--ok-bg` (a „benne" jelvény, a bekötött csatorna pontja, a „kimenő" hatásos állapot), `--warn` / `--warn-bg` / `--warn-border` (a kikapcsolt AI és a hírfigyelő sávja — **nem hibaszín**), `--tile-min` (a Gépház rácsa), `--control-min` (telefonon minden választó-állás), `--fs-metric` (a csempék mérőszáma), a tizenöt térközfok.

**Egy dolog, amit a Theme-en érdemes ellenőrizni:** a Kimenő lap négy oszlopa 1440-en fix szélességekkel áll (140 · 300 · 160 px). Ha a Theme-ben a betűméret jóval nagyobbra állítható, ezek az oszlopok szűkek lehetnek — a kódban `minmax`-szal, ne fix px-szel.
