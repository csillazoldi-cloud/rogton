# Tokenek — R-2 · Tagok és meghívás

**Új token nincs.** A rajz `:root`-ja az R-1 v4 rajzból van szó szerint átvéve, tehát a kód főágának `packages/design-system/src/tema-alap.json`-jával egyezik.

## Térköz — a tizenöt fok

Minden `gap`, `padding` és `margin` a `--ter-0…14` fokokból jön. Pixelérték térközként nem szerepel a rajzon.

A leggyakoribbak ezen a lapon: a táblázat sorainak belső tere `var(--ter-6) var(--pad-tile)`, a kártyák `var(--pad-tile)` (= `--ter-8`), a párbeszédek `var(--pad-block)` (= `--ter-9`), a lapszél `var(--ter-10)`, az alsó megerősítő sáv `var(--ter-7) var(--ter-10)`.

## Vezérlőméretek

| Hol | Token |
|---|---|
| elsődleges és másodlagos gombok, rádiós sorok, telefonos gombok | `--control-min` (44px) |
| a sávban álló vezérlők, a „Másolás” és a szerep-lenyíló a listán | `--control-min-s` (36px) |

**Szabály, amit az R-1-ben megjártunk:** ahol `min-height` van, ott `box-sizing:border-box` és `inline-flex` + `align-items:center` kell, függőleges belső tér nélkül — különben a padding hozzáadódik a minimális magassághoz. A rajz minden gombja így készült.

## Alakértékek — szándékosan nem token

A 26×26-os termékjel a sávban, a 8 pixeles állapotpont, a beváltó-lapi jelzők, és a munkatér-lenyíló 300px-es szélessége. Ezek az elem saját méretei, nem térközök.

## Színek — mit jelent melyik

| Szerep / állapot | Token |
|---|---|
| tulajdonos | `--src-ai` / `--src-ai-bg` |
| szerkesztő | `--src-web` / `--src-web-bg` |
| néző | `--src-empty` / `--src-empty-bg` |
| függő meghívó, figyelmeztetés, zárt út | `--warn` / `--warn-border` / `--warn-bg` |
| hibaút a beváltó lapon | `--err` / `--err-border` / `--err-bg` |
| kijelölt sor, megerősítésre váró állapot | `--focus` / `--focus-ring` |

A szerepek színe **nem** hordozza egyedül a jelentést: mindhárom jelvényben ott a szó is. A „már tag” eset szándékosan semleges színű, mert tájékoztatás, nem hiba.
