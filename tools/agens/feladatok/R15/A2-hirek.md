# R-15 · A2 — 04 Hírek a rajzból („Van valami, amiből posztot csinálhatok?”)

Írd meg: `apps/web/app/hirfigyelo/R15Hirek.tsx` és `apps/web/app/hirfigyelo/r15-hirek.css`.
Rajz: `04-hirek.resz.html` (asztali 1440 + telefon 390). A felső sávot NEM te írod — a rajz felső sávját hagyd ki.

Props: `export function R15Hirek({ adat }: { adat: R15Hirek })`.

A képernyő (a rajz szerint):
- `KerdesCim`: `n = adat.kartyak.length`; `n > 0` → `t("r15.hirek.kerdes", { n })`, `n === 0` → `t("r15.kezdolap.kerdes_nulla")`. Alcím nincs.
- `Halad` a `r15.kozos.halad_rovid` szöveggel ({poszt}, {kep}), `arany = adat.halad.arany`.
- **Kártyák** (asztalon két hasáb, telefonon egymás alatt — a rajz szerint), mindegyik `Teendo`-kinézet:
  - kis sor: `k.forras_nev`
  - nagy cím: `k.rovid_cim || k.cim` — gombként/linkként a **Részletekre** visz: `href={"/hirfigyelo/osszes?talalat=" + k.talalat_id}`; `title={k.cim}`
  - `k.otlet` ha nem üres: `t("r15.hirek.otlet", { otlet: k.otlet })` halk sorban
  - gomb: az ELSŐ kártyán `FoGomb posztra` (`r15.hirek.atnezem_posztot`), a többin `HalkGomb` ugyanazzal a szöveggel. Megnyomásra: ha `k.munka_id` → `router.push("/poszt?munka=" + k.munka_id)`; különben `hivas("/api/r15/hirek/" + k.talalat_id + "/poszt", "POST", {})` → a válasz `torzs.munka_id` (string) → `router.push("/poszt?munka=" + munka_id)`. Közben a gomb `disabled`.
  - `···` gomb (a rajz szerint, `aria-label` a rajzból) → kis lenyíló menü három sorral: `r15.kozos.reszletek` (→ a Részletek címe, lásd fent), `r15.hirek.elmentem` (→ `hivas("/api/hirfigyelo/talalatok/" + id + "/jelol", "POST", { jeloles: "mentett" })`, utána `refresh()`), `r15.hirek.nem_erdekel` (→ ugyanaz `{ jeloles: "elrejtett" }`, utána a kártya azonnal eltűnik a listából, majd `refresh()`). Ha `k.mentett`, az „Elmentem” sor helyett nincs sor. A menü kívül kattintásra és Esc-re zár.
  - **Telefonon** (a rajz szerint): az első kártyán NINCS gomb; a lap alján rögzítve a `FoGomb` `r15.hirek.atnezem_elsot` (az első kártya műveletével); a többi kártyán `HalkGomb` `r15.hirek.atnezem`. A `···` telefonon is ott van. Ezt CSS-sel váltod (`r15h-asztali` / `r15h-telefon`), a telefonos `FoGomb` csak egy van a DOM-ban látható módon.
- `adat.kihagyott > 0` → `Info` `t("r15.hirek.kihagytuk", { n: adat.kihagyott })` a kártyák alatt.
- Alul `Info`: asztalon a rajz szerint `t("r15.kozos.legutobb", { mikor })` (mikor: `r15.ido.ma` / `r15.ido.tegnap` / `t("r15.ido.napja", { n })`; `null` → a sor elmarad).
- Alatta két `HalkLink` egy sorban:
  - `r15.hirek.keress_most` → `hivas("/api/hirfigyelo/futas", "POST", {})`, utána `refresh()`; ha `adat.fut` vagy `!adat.szerkeszthet`, `disabled`.
  - „Hírek beállításai” — a kulcs `r15.hirek.beallitasok` — lenyíló menü négy sorral (a rajz `title` attribútuma szerint): `r15.hirek.miert_ezek` → `/hirfigyelo/osszes#osszkep`, `r15.hirek.mit_figyeljunk` → `/hirfigyelo/beallitas`, `r15.hirek.pontositas` → `/hirfigyelo/finomhangolas`, `r15.hirek.elmentett` → `/hirfigyelo/osszes?szuro=mentett`.
- A `···` és a „Hírek beállításai” menü: egyszerű `div` a gomb alatt, `role="menu"`, a sorok `role="menuitem"` linkek/gombok; kinézet: `--bg-elev` háttér, `--border` keret, `--r-card` sarok, `--ter-4` belső térköz.

Mellékletek: `_kozos.md` (szabályok), `04-hirek.resz.html`, `R15.tsx`, `r15.css`, `tipusok.ts`, `feliratok.json`.
