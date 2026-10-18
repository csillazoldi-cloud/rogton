# Tokenek — R-3 · Saját fiók

**Új token nincs.** A rajz `:root`-ja az R-1 v4 rajzból van szó szerint átvéve.

## Térköz

Minden `gap`, `padding` és `margin` a `--ter-0…14` fokokból. A leggyakoribbak: a blokkok belső tere `var(--pad-block)` (= `--ter-9`), telefonon `var(--ter-7)`; a lista sorai `var(--ter-7) var(--pad-tile)`; a lapszél `var(--ter-10)`, telefonon `var(--ter-8)`; az alsó megerősítő sáv `var(--ter-7) var(--ter-10)`.

## Vezérlőméretek

Minden beviteli mező, választó és gomb `--control-min` (44px) — ez a lap tele van űrlapmezőkkel, és mindegyik írható. Kivétel a listán álló „Kilépek" és a sávban álló vezérlők: `--control-min-s` (36px).

**Az R-1-ből átvett szabály:** ahol `min-height` van, ott `box-sizing:border-box` és `inline-flex` + `align-items:center` kell, függőleges belső tér nélkül.

## Színek — mit jelent melyik

| Állapot | Token |
|---|---|
| zárt mező (e-mail), zárt gomb | `--line-dash` szaggatott keret, `--text-faint` szöveg, `--panel-soft-2` háttér |
| hiba a mezőnél | `--err-strong` keret, `--err` szöveg, a kártyán `--err-border` |
| a jelszóváltás következménye (figyelmeztetés, nem hiba) | `--warn` / `--warn-border` / `--warn-bg` |
| siker | `--ok` / `--ok-bg`, plusz a 8 pixeles `--ok-strong` pont |
| megerősítésre váró sor | `--focus-ring` háttér |
| szerepek | tulajdonos `--src-ai`, szerkesztő `--src-web`, néző `--src-empty` |

Az „utolsó tulajdonos" esete **figyelmeztető**, nem hibaszínű: nem a felhasználó hibázott, hanem a művelet nem értelmes ebben az állapotban.

## Alakértékek — szándékosan nem token

A 26×26-os termékjel, a 8 pixeles siker-pont, a 18 pixeles pörgő jelző a mentés közben, és a telefonos hamburger `--control-min` × `--control-min` négyzete (ez utóbbi tokenből, de méretként, nem térközként).
