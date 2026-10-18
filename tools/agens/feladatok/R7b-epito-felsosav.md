# R-7b · Építő — a felső sáv (`apps/web/app/_kozos/FelsoSav.tsx`): „Hírek" közvetlen menüpont, az új nevek, az aktív állapot a rajz szerint

CÉL: a felső sáv a Design R-7b rajza (melléklet: `R7b-kezdolap-hirek.dc.html` — a 01–02. artboard fejléce) és a D-F43 3.1 A döntés szerint: **Kezdőlap · Hírek · Szervezet adatai · Beállítások** (+ a harang, nyelv, fiók, Kilépés — ezek maradnak). Egy fájlt adsz vissza egészben.

TÉNYEK (mérve, nem kell ellenőrizni):
- Ma a sáv: `nav.kezdolap` link → `/kezdolap`; **„Modulok" lenyíló** (`nav.modulok`, benne a `hf.modTitle` sor → `/hirfigyelo` az `adat.uj_talalat` jelvénnyel, két üres helyfoglaló és a `nav.tovabbi_modulok` mondat); `nav.ugyfelprofil` → `/fiok`; `nav.gephaz` → `/gephaz` (csak ha `adat.gephaz`). Az aktív pont `aktiv` prop szerint (`"kezdolap" | "ugyfelprofil" | "gephaz" | "sajat" | "nincs"` — a pontos uniót a fájlból vedd), osztály `km-sav-nav-aktiv` / `km-sav-nav-link`.
- `adat.modulok: string[]` — a csomag moduljai (ma `["hirfigyelo"]`); `adat.uj_talalat: number`.
- A feliratok ÉRTÉKE a 0064 migrációval már az új: `nav.kezdolap` = „Kezdőlap", `nav.modulok` = „Hírek", `nav.ugyfelprofil` = „Szervezet adatai", `nav.gephaz` = „Beállítások", `hf.modTitle` = „Hírek". A kulcsokhoz NEM nyúlsz, csak a szerkezethez.
- Telefonon (hamburger menü, a fájl alsó része) a modul sora `href="/hirfigyelo"`-ra mutat, a `nav.beallitasok` sor `/beallitasok`-ra — ezt a részt is igazítsd (lásd 2.).

MIT CSINÁLJ:
1. **Egy modulnál nincs lenyíló** (a rajz 01–02 fejléce és a Design válasza a kérés 8.1-re): ha `adat.modulok.length <= 1` és a hírfigyelő benne van → a „Modulok" gomb + lenyíló HELYETT egy sima `<Link href="/hirfigyelo">` a `hf.modTitle` felirattal (= „Hírek"), mellette az `nav.uj_talalat_jelzes` jelvény ha `adat.uj_talalat > 0` (ugyanaz a `km-sav-lenyilo-jelveny` osztály — a CSS-t ÉN igazítom). Aktív állapota: az `aktiv` uniót bővítsd `"hirek"`-kel, és ha `aktiv === "hirek"`, a link `km-sav-nav-aktiv`. Ha `adat.modulok.length > 1` → a mai lenyíló marad változatlanul (a két helyfoglaló és a `nav.tovabbi_modulok` mondat viszont MINDKÉT ágban elmarad — az audit „mobilmenüben üres helyek" pontja). Ha a hírfigyelő nincs a csomagban → a pont nem jelenik meg.
2. Telefonos menü: a modul-sor ugyanezt a szabályt kövesse (egy modul → sima „Hírek" sor jelvénnyel; nincs helyfoglaló, nincs `nav.tovabbi_modulok`).
3. A sorrend a sávban: Kezdőlap · Hírek · Szervezet adatai · Beállítások (ez az `/gephaz` link — az útvonal marad, csak a felirat új; a `/beallitasok` az Értesítések lapja, a harang mögött — nem kerül a főmenübe).
4. Minden más (munkatér-lenyíló, Tagok sora, nyelv, fiók-név, Kilépés, harang) VÁLTOZATLAN. Nem írsz át semmit, ami nem a fenti négy pont.

HATÁR: az egy fájl. CSS-hez nem nyúlsz (a `km-sav-nav-hirek-jelveny` osztályt ADD a jelvény span-jára a `km-sav-lenyilo-jelveny` MELLÉ — a stílusát én írom). TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`). Minden szöveg `t()`-ből; `t(kulcs, ertekek?)` legfeljebb két argumentum. A hívóhelyek `aktiv="hirek"` értéket még nem adnak — az a HirfigyeloKeret dolga (én), tehát az unió bővítése ne törje a meglévő hívásokat.
KÉSZ, HA: `pnpm --filter web tipus` zöld; egy modulnál a sávban „Hírek" link áll lenyíló nélkül; több modulnál a lenyíló; telefonon ugyanígy.
Visszaadás: a teljes `apps/web/app/_kozos/FelsoSav.tsx`, `=== FÁJL: … ===` … `=== FÁJL VÉGE ===` blokkban. Semmi más szöveg, gondolkodás nélkül.
