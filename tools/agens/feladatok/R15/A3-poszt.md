# R-15 · A3 — 08 Posztszöveg a rajzból („Kész a posztom?”)

Írd meg: `apps/web/app/poszt/R15Poszt.tsx` és `apps/web/app/poszt/r15-poszt.css`.
Rajz: `08-poszt.resz.html` — három képernyő: asztali átnézés, telefonos átnézés, telefonos kész-pillanat. A felső sávot NEM te írod — hagyd ki (a telefonos rajz felső sávjában a „Díszburkolat · 1/2 ▾” választó VISZONT a te lapod része: telefonon ez a bal oldali lista helyett áll, lenyílóként).

Props:
```ts
export function R15Poszt({ lista, munka, nyelv, iranytuVan }: {
  lista: R15PosztLista;           // bal oldali lista: Vár rád · Kész
  munka: PosztMunka | null;       // a kiválasztott poszt (import type { PosztMunka } from "@km/contracts")
  nyelv: "hu" | "ro" | "en";      // a szervezet első tartalomnyelve — ezen készül a poszt
  iranytuVan: boolean;            // van-e jóváhagyott iránytű
})
```

Mai gépezet — a mellékelt MAI `Poszt.tsx` mutatja, hogyan hívja (ugyanígy hívod, ugyanazokkal a törzsekkel): `GET /api/poszt/{id}` (a munka), `POST /api/poszt/{id}/szoveg` `{ felulet, nyelv }` (a gép megírja), `PUT /api/poszt/{id}` (kézi mentés — nézd meg a mai fájlban a törzset), `POST /api/poszt/{id}/atiras` `{ felulet, nyelv, muvelet: "rovidebb"|"hosszabb"|"kozvetlenebb"|"targyilagosabb"|"hashtag" }`, `POST /api/poszt/{id}/forditas`, `POST /api/poszt/{id}/nyelvre-szabas`, `POST /api/poszt/{id}/osszhang`. Új: `POST /api/r15/poszt/{id}/kesz` `{ felulet, nyelv }` → `R15KeszValasz`.

A képernyő (a rajz szerint):
- **Bal lista** (asztalon): csoportcím `r15.poszt.var_rad` · {varo.length}, alatta a váró posztok `rovid_nev`-vel (a kiválasztott kiemelve, `Link href="/poszt?munka=…"`); `r15.poszt.kesz_csoport` · {kesz.length}, a kész posztok ✓ jellel; alul `HalkLink` `r15.poszt.sajat_otlet` → `hivas("/api/poszt", "POST", { forras: { tipus: "sajat" }, felulet: "fb", nyelv, uj: true })` → `router.push("/poszt?munka=" + torzs.munka.id)` (nézd meg a mai fájlban a válasz alakját). **Telefonon** a lista helyett egy lenyíló a lap tetején: `{rovid_nev} · {sorszám}/{varo.length} ▾`.
- `KerdesCim`: cím `r15.poszt.kerdes`; alcím asztalon `t("r15.poszt.alcim", { nev: rovid név })` ha a forrás hír, különben `r15.poszt.alcim_rovid`; telefonon mindig `r15.poszt.alcim_rovid`. A rövid név: `munka.forras.rovid_nev || munka.cim`.
- `Halad` (asztalon, `r15.kozos.halad`) — az adatot a lap a `lista`-ból nem tudja: a props `halad?: R15Halad` is jön (vedd fel a props közé, opcionális; ha nincs, a sor elmarad).
- **Platform-fülek**: Facebook · Instagram · LinkedIn (a rajz szerint; a nevek márkanevek, fordítás nélkül). Az aktív fül a `felulet` állapot (alap `"fb"`). Fülváltáskor, ha a cellában (`munka.szovegek` felulet+nyelv) nincs szöveg, a gép megírja (`/szoveg`), közben a mező helyén `r15.poszt.irjuk`.
- **A szöveg** `<textarea data-r15="eredmeny">` a cella szövegével; szerkeszthető; gépelés után 800 ms-mal kézi mentés (a mai fájl szerint). Ha a munkának még nincs szövege ezen a cellán, a lap betöltéskor magától hívja a `/szoveg`-et, és addig `r15.poszt.irjuk` áll a mező helyén (üres mező soha nem látszik).
- **Átírnád?** sor (asztalon): címke `r15.poszt.atirnad`, `HalkGomb`-ok: `r15.poszt.rovidebben` (rovidebb), `r15.poszt.kozvetlenebbul` (kozvetlenebb), `r15.poszt.uj_valtozat` (`/szoveg` újra). Telefonon a rajz szerint csak Rövidebben · Új változat.
- `Továbbiak ▾` (`r15.poszt.tovabbiak`) lenyíló: Bővebben (hosszabb) · Tárgyilagosabban (targyilagosabb) · Hashtagek (hashtag) · Visszavonás (a cella `javaslat` mezőjére visszaállít és ment) · `r15.poszt.csak_masolas` (vágólapra, készre jelölés nélkül). A „Bővebben”, „Tárgyilagosabban”, „Hashtagek”, „Visszavonás” szövegét a MAI `Poszt.tsx`-ben használt kulcsokból veszed (nézd meg ott). A „Mit írtál át?” a mai fájlban meglévő eredet-jelölés — ha a mai fájlban van rá gomb és kulcs, tedd a menübe ugyanazzal a működéssel; ha nincs, hagyd ki.
- `FoGomb` `r15.poszt.kesz_masolom`: `navigator.clipboard.writeText(szoveg)`, majd `hivas("/api/r15/poszt/" + id + "/kesz", "POST", { felulet, nyelv })` → a válasz `R15KeszValasz` → **kész-pillanat** (a harmadik rajz-képernyő, ugyanezen a lapon, állapotként): `KeszPillanat` nagyban: `r15.kesz.cim`, alatta `t("r15.kesz.alcim", { platform: Facebook|Instagram|LinkedIn })`, `t("r15.kesz.hanyadik", { sorszam })` — a sorszám szóval: 1 → „első”, 2 → „második” … 10 → „tizedik”, efölött szám + „.”; a szavakat a `r15.sorszam.1` … `r15.sorszam.10` kulcsokból. A fő gomb: ha `kovetkezo_id` → `t("r15.kesz.kovetkezo", { n: varo_db })` → `/poszt?munka=` + kovetkezo_id; különben `r15.kesz.kezdolapra` → `/kezdolap`. Mellette `HalkLink` `r15.kozos.kep_hozza` → `/kepek?poszt=` + id.
  Mellette halk szöveg: `t("r15.poszt.karakter", { n: szoveg.length })` (asztalon).
- **Jobb oszlop** (asztalon): cím `r15.poszt.kep_a_poszthoz`, üres képhely `r15.poszt.nincs_kep`, `HalkGomb` `r15.poszt.kep_keszitese` → `/kepek?poszt=` + id; alatta `HalkLink` `r15.poszt.mas_nyelven` → kis lenyíló a szervezet másik két nyelvével (hu/ro/en közül nem a `nyelv`; a nevek: a MAI `Poszt.tsx` nyelv-feliratai) → kiválasztva a mai `/forditas` hívással elkészül, és a lap arra a nyelvre vált (`nyelv` állapot). Telefonon a rajz szerint a „Kép hozzá” a fő gomb mellett.
- **Iránytű sor:** ha `iranytuVan` ÉS `munka.osszhang?.allapot === "ok"` → `Info` `r15.poszt.illik_iranytu`. Ha `ellentmond` → `Info` a `munka.osszhang.mondat` szövegével. Különben semmi.
- Ha `munka === null` és van váró poszt: a lap a lista első elemét nyitja (`router.replace`). Ha egyáltalán nincs poszt: csak a bal lista és a „Saját ötletből”.

Mellékletek: `_kozos.md`, `08-poszt.resz.html`, `R15.tsx`, `r15.css`, `tipusok.ts`, `feliratok.json`, a MAI `Poszt.tsx` (a hívások és kulcsok mintája — NEM írod át).
