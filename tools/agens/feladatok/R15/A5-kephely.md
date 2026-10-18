# R-15 · A5 — 08c: a kép helye a poszton (három út) + „Melyik kép menjen hozzá?” + „Melyik poszthoz tegyük?”

Írd meg: `apps/web/app/poszt/R15KepHely.tsx` és `apps/web/app/kepek/R15PoszthozTeszem.tsx` (CSS: `apps/web/app/poszt/r15-kephely.css`).
Rajz: `08c-kep.resz.html` — 1 · a kép helye · 2 · Kész képeim · 3 · a kép a poszton · 6 · Melyik poszthoz?

**1) `R15KepHely`** — a poszt előnézetében a kép helyére kerül (a lap adja át `kepHelye`-ként):
```ts
export function R15KepHely({ posztId, kep, kepek, onValtozott }: {
  posztId: string; kep: R15Kep | null; kepek: R15Kep[]; onValtozott: () => void;   // onValtozott: a lap újratölt (router.refresh)
})
```
- **Nincs kép** (rajz 1): halk mondat `r15.kep.tegyel`, alatta három halk gomb egymás alatt: `r15.kep.feltoltok` (rejtett `<input type="file" accept="image/png,image/jpeg,image/webp">` — telefonon ez a galéria/kamera), `t("r15.kep.kesz_kepeim", { n: kepek.length })` (csak ha `kepek.length > 0`), `r15.kep.uj_kep` (→ `href="/kepek/uj/hir?poszt=" + posztId`). A feltöltés: `fetch("/api/r15/kep", { method: "POST", body: file, headers: { "x-fajl-nev": encodeURIComponent(file.name), "x-poszt": posztId } })` → 201 → `onValtozott()`; közben a gomb helyén „…”, hibánál egy halk sor a hiba kódjával (`hiba` a válaszból) — a szöveget a `vz.hiba_*`-hoz hasonlóan NEM találod ki: írd ki `r15.kep.tegyel` helyett a mai `arculat_fajl.hiba_tipus` kulcsot 415-nél, `arculat_fajl.hiba_meret`-et 413-nál, különben `poszt.hiba_ai`.
- **Kész képeim** (rajz 2, a „Kész képeim közül” gombra): a lap fölött teljes képernyős réteg (telefon) / felugró (asztal, `role="dialog"`): cím `r15.kep.melyik_kep`, a képek rácsban (kép + név; a kiválasztott ✓ jelet kap), alul `HalkGomb` `r15.kep.megse` és `FoGomb` `r15.kep.ezt_teszem` → `hivas("/api/r15/poszt/" + posztId + "/kep", "PUT", { kep_id })` → `onValtozott()`, a réteg zár.
- **Van kép** (rajz 3): a kép (`kep.url`, a platform arányában — ezt a szülő adja, te csak `<img>`-et adsz `object-fit: cover`-rel, 100% szélességgel), alatta a kép neve halkan, és két halk link: `r15.kep.masik` (→ a Kész képeim réteg) és `r15.kep.kep_nelkul` (→ PUT `{ kep_id: null }` → `onValtozott()`).

**2) `R15PoszthozTeszem`** (rajz 6) — a Képek lapról nyílik, felugróként:
```ts
export function R15PoszthozTeszem({ kepId, kepSzoveg, onZar }: { kepId: string; kepSzoveg: string; onZar: () => void })
```
- Betöltéskor `hivas("/api/r15/poszt-lista", "GET")` → `torzs.lista` (`R15PosztLista`). Cím `r15.kep.melyik_poszt`. Sorok: a váró posztok (`rovid_nev` + halk `r15.kep.var_rad`), a kész posztok (`rovid_nev` + halk `r15.kep.kesz` ✓), rádiógombként; utolsó sor `r15.kep.uj_poszt`. Alul `FoGomb` `r15.kep.hozzateszem`:
  - poszt választva → `PUT /api/r15/poszt/{id}/kep { kep_id: kepId }` → `router.push("/poszt?munka=" + id)`
  - „Új poszt” → `POST /api/r15/kep/{kepId}/poszt { szoveg: kepSzoveg }` → `torzs.munka_id` → `router.push("/poszt?munka=" + munka_id)`.
  - `HalkGomb` `r15.kep.megse` → `onZar()`.

Mellékletek: `_kozos.md`, `08c-kep.resz.html`, `R15.tsx`, `r15.css`, `r15-lapok.css`, `tipusok.ts`, `feliratok.json`.
