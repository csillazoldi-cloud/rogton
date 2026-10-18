# Tokenek — R-6 · Fájlfeltöltés az arculathoz

**Új token nincs.** A rajz `:root`-ja az R-1 v4 rajzból, szó szerint.

## Térköz

Minden `gap`, `padding` és `margin` a `--ter-0…14` fokokból. A feltöltő mező belső tere `var(--ter-9)`, telefonon `var(--ter-8)`; a fájlsorok `var(--ter-6) var(--ter-7)`; a blokkok `var(--pad-block)`; a lapszél `var(--ter-10)`, telefonon `var(--ter-8)`.

## Vezérlőméretek

| Hol | Token |
|---|---|
| a telefonos feltöltő mező (kattintható felület), a megerősítés gombjai | `--control-min` (44px) |
| Csere és Megnyitás a fájlsorokon | `--control-min-s` (36px) |

**Az R-1-ből átvett szabály:** ahol `min-height` van, ott `box-sizing:border-box` és `inline-flex` + `align-items:center` kell, függőleges belső tér nélkül.

## Az előnézet keretei — alakértékek, nem tokenek

| Hol | Méret |
|---|---|
| a fájlsor kis előnézete | 34×34 |
| a kész feltöltés előnézete | 56×56 |
| a 04. artboard előnézet-keretei | 120px magas |
| a pörgő jelző feltöltés közben | 18×18 |

A **keret mérete nem változik a fájltól** — a lista sorai egyforma magasak maradnak, akármilyen arányú a kép. Ez az előnézet szabálya, nem stílusdöntés.

## Az előnézet háttere — szándékosan nem token

A világos előnézet háttere `#ffffff`, a sötét `#14151b`. **Ez nem a SaaS-témából jön**, és nem is a brandprofilból: ez két referenciaháttér, amin a logó olvashatóságát mérjük. Ha a téma háttérszínét használnánk, a Theme átállítása megváltoztatná az előnézet jelentését — ezért fix.

A logó mintaszíne a rajzon `#2f5d4e` (a brandprofil-minta elsődleges színe) — **fiktív mintaadat**, nem token.

## Színek — mit jelent melyik

| Állapot | Token |
|---|---|
| üres feltöltő mező | `--line-dash` szaggatott keret, `--panel-soft-2` háttér |
| feltöltés közben | `--focus` keret, `--accent` a pörgő jelzőn |
| feltöltött fájl sora | `--line-soft` keret, `--panel-soft-2` háttér |
| „ez van használatban" | `--src-web` / `--src-web-bg` |
| korábbi példány | `--text-dim`, 0,7 áttetszőség |
| hiba | `--err-strong` keret, `--err` szöveg, `--err-bg` háttér |
| a csere következménye (figyelmeztetés) | `--warn` / `--warn-border` / `--warn-bg` |
| nem jóváhagyott tervezet | `--src-ai` / `--src-ai-bg` |
