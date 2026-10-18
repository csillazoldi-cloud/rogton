# R-15 · A1 — 03 Kezdőlap a rajzból („Mi a dolgom ma?”)

Írd meg: `apps/web/app/kezdolap/R15Kezdolap.tsx` és `apps/web/app/kezdolap/r15-kezdolap.css`.
Rajz: `03-kezdolap.resz.html` (asztali 1440 + telefon 390). A felső sávot NEM te írod (a lap fölött már ott van) — a rajz felső sávját hagyd ki.

Props: `export function R15Kezdolap({ adat }: { adat: R15Kezdolap })`.

A képernyő (a rajz szerint):
- `KerdesCim`: cím `adat.varo.length > 0 ? t("r15.kezdolap.kerdes", { n }) : t("r15.kezdolap.kerdes_nulla")`; alcím `t("r15.kezdolap.alcim", { n })` csak ha `n > 0` (n = a váró posztok közül a `forras_tipus === "hir"` darabszáma; ha 0, az alcím elmarad).
- `Halad`: `arany = adat.halad.arany`; szöveg asztalon `r15.kozos.halad` ({poszt}, {kep}), telefonon `r15.kozos.halad_rovid` — mindkettőt kirakod, CSS-sel váltasz (`r15k-asztali` / `r15k-telefon` osztály).
- **Nagy kártya** (`Teendo`, `adat.varo[0]`, ha van): kis sor `t("r15.kezdolap.honnan", { nev: v.rovid_nev })`, nagy cím `v.elso_sor || v.forras_cim`, alatta `v.masodik_sor` (telefonon a rajz szerint elmarad); `FoGomb posztra href={"/poszt?munka=" + v.id}` → `r15.kezdolap.atnezem_posztot`; mellette `HalkLink href={"/kepek?poszt=" + v.id}` → `r15.kozos.kep_hozza` (telefonon a rajz szerint nincs a kártyán). A fő gomb telefonon a lap alján rögzítve (a rajz alsó sávja).
- **„Még vár” lista** (jobbra asztalon, alatta telefonon): `adat.meg_var` elemei, soronként szöveg + `HalkGomb`:
  - `{kod:"poszt"}` → szöveg `t("r15.kezdolap.poszt_sor", { nev: poszt.rovid_nev })`, gomb `r15.kezdolap.atnezem` → `href="/poszt?munka=" + id`
  - `{kod:"napi_figyeles"}` → `r15.kezdolap.napi_figyeles`, gomb `r15.kezdolap.bekapcsolom` → `hivas("/api/r15/napi-figyeles", "PUT", {})`, siker után `refresh()`; közben a gomb `disabled`. Ha `!adat.szerkeszthet`, ez a sor nem jelenik meg.
  - `{kod:"celok"}` → `r15.kezdolap.celok`, gomb `r15.kezdolap.megirom` → `href="/iranytu"`
  - Telefonon csak az ELSŐ elem látszik, alatta `HalkLink` `t("r15.kezdolap.meg_apro", { n: maradék })` — egy érintésre helyben kinyílik (állapot), és a többi is látszik. Asztalon mind látszik, a link nincs.
  - Ha `meg_var` üres, a lista elmarad.
- Ha `adat.varo` üres: nincs nagy kártya és nincs fő gomb — ekkor a „Még vár” lista első eleme kapja a teendő-kinézetet (ha van); ha az is üres, csak a cím és a haladás áll.
- Alul `Info`: `t("r15.kozos.legutobb", { mikor })`, ahol `mikor` = 0 → „ma”, 1 → „tegnap”, n → „{n} napja” — ezt a három szót a `r15.ido.ma`, `r15.ido.tegnap`, `r15.ido.napja` kulcsból veszed (`t("r15.ido.napja", { n })`). Ha `utolso_kereses_nap === null`, a sor elmarad.

Mellékletek: `_kozos.md` (szabályok), `03-kezdolap.resz.html`, `R15.tsx`, `r15.css`, `tipusok.ts`, `feliratok.json`, a mai `Kezdolap.tsx` (csak minta a felépítésre — NEM írod át).
