# Tokenek — R-4

Az alap az R-1 v4 `:root`-ja, szó szerint, változtatás nélkül. **Négy új token** kell, mind a „még nem működik" jelölés és a kapcsolók miatt; mindegyik a Theme-felületen is állítható legyen.

| Token | Érték a rajzon | Mire való |
|---|---|---|
| `--keszul` | `#9fb0d8` | a „még nem működik" jelölés szövege és kerete — halk kék-szürke, **szándékosan nem hibaszín és nem a figyelmeztető narancs** |
| `--keszul-bg` | `color-mix(in srgb, var(--keszul) 11%, transparent)` | a jelölt blokk alapja |
| `--keszul-border` | `color-mix(in srgb, var(--keszul) 34%, transparent)` | a szaggatott keret és a kikapcsolt kapcsoló kerete |
| `--olvasatlan` | `var(--primary-2)` | az olvasatlan pont és a harang száma — külön néven, hogy a jelentése látszódjon |

Méret: a kapcsoló két értéke (`--kapcsolo-w` 38px, `--kapcsolo-h` 22px) szintén tokenként áll a rajzban. Ha a rendszerben már van kapcsoló-komponens a saját méreteivel, **a rendszeré a hiteles**, és ez a kettő elhagyható.

Minden más — szín, betű, méret, térköz, lekerekítés — a meglévő készletből jön. Térköz kizárólag a tizenöt fokból (`--ter-0…14`).
