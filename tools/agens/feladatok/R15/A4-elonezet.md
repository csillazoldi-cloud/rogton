# R-15 · A4 — 08b „Így fog kinézni”: az előnézet-kártya (Facebook · Instagram · LinkedIn)

Írd meg: `apps/web/app/poszt/R15Elonezet.tsx` (+ a kártya CSS-ét a fájl végén egy `/* CSS */` blokk helyett KÜLÖN fájlban: `apps/web/app/poszt/r15-elonezet.css`).
Rajz: `08b-elonezet.resz.html` — az előnézet-kártyák (a „Így fog kinézni” cím alatt). A lap többi részét (lista, mező, fülek) NEM te írod.

```ts
export function R15Elonezet({ felulet, szoveg, ceg, kep, kepHelye }: {
  felulet: "fb" | "ig" | "li";
  szoveg: string;              // a kész poszt szövege
  ceg: R15Ceg;                 // tipusok.ts
  kep: R15Kep | null;          // tipusok.ts — ha van, a kép a helyén (url)
  kepHelye?: React.ReactNode;  // ha nincs kép: ezt rakod a kép helyére (a képválasztót a lap adja); ha nincs megadva, a rajz „Még nincs kép.” / „Instagramra kép kell.” helyét rajzolod gomb nélkül
})
```
- A vágás: `elonezetVag(szoveg, felulet)` a mellékelt `szamol.ts`-ből (`import { elonezetVag } from "../../r15/szamol";`) → `{ latszo, vagott, tul }`. Ha `vagott`: a szöveg után `… ` + halk szó: Facebookon `r15.elo.tovabbiak`, Instagramon és LinkedInen `r15.elo.tobb`. A kártya ALATT halk sor (`Info`): nem vágott → `r15.elo.teljes`; vágott → `t("r15.elo.eleje", { jel: <a Továbbiak/több szó> })`.
- `tul` (a platform felső határa fölött) → a kártya fölött `Baj` (R15.tsx) egy mondattal — kulcs nincs rá a feliratok.json-ban: használd `r15.poszt.rovidebben` gombfeliratot és a `poszt.tul_hosszu` kulcsot `{ max }` paraméterrel (max: Facebook 63206, Instagram 2200, LinkedIn 3000); a gomb `onClick` a props `onRovidebben?: () => void` (vedd fel).
- **Facebook** (rajz): fejléc kör alakú kép (logó `ceg.logo_url`, különben a `ceg.kezdobetuk` egy színes körben) · név · `r15.elo.most` + „ · Nyilvános” — a „Nyilvános” szót nem fordítjuk, márkafelület; a jobb szélen `···` (díszítés, nem gomb: `<span aria-hidden>`) · a szöveg (`white-space: pre-wrap`) · a kép alul, fekvő (1,91:1, `object-fit: cover`) vagy `kepHelye` · alsó sor: Tetszik · Hozzászólás · Megosztás (díszítés, `aria-hidden`, nem gomb).
- **Instagram**: fejléc kör + `ceg.felhasznalo` · kép FELÜL, négyzetes (vagy `kepHelye`) · ikonsor (egyszerű inline SVG körvonalak: szív, buborék, papírrepülő, könyvjelző; `aria-hidden`) · felirat: **félkövér `ceg.felhasznalo`** + szóköz + a vágott szöveg + `… több` · alatta kis nagybetűs `r15.elo.most`.
- **LinkedIn**: fejléc NÉGYZETES logó/kezdőbetűk · név · alatta halk `r15.elo.li_meta` · jobbra „+ Követés” (díszítés) · szöveg · kép alul fekvő · alsó sor: Tetszik · Hozzászólás · Újraküldés · Küldés (díszítés).
- A kártya **mindig világos**, semleges „feed” színekkel (gepezet 16) — ezeket a CSS-fájl elején `:root`-ban definiáld `--elo-bg`, `--elo-text`, `--elo-mut`, `--elo-line`, `--elo-kor` változóként, mindegyik sor végén `/* tokenőr: ok — R15 08b előnézet: szándékosan nem séma-token */`. Minden más érték token (`--ter-*`, `--fs-*`, `--r-*`).
- A rajz jelölései: a kártya szövege `data-r15="eredmeny"`; a halk sor `Info`.
- Semmilyen platform-logót ne másolj.

Mellékletek: `_kozos.md`, `08b-elonezet.resz.html`, `R15.tsx`, `r15.css`, `r15-lapok.css`, `tipusok.ts`, `szamol.ts`, `feliratok.json`.
