# Feladat — ÉPÍTŐ (F9-L1 + F9-L4): szerep szerinti láthatóság; a telefonos menü két „Beállítások” sora

TypeScript 7 strict, Next.js 16 app router, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza, TELJES fájltartalommal. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból (`t("…")`). Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. CSAK az alább felsorolt 5 fájlt adod vissza; minden más sor betűre ugyanaz marad, mint a mellékletben.

## MÉRT tények (2026-09-14, a teszten, szerkesztő és néző fiókkal)

1. A `/tema` (Megjelenés) és a `/feliratok` (Felület szövegei) lap szerkesztőnek és nézőnek is megnyílik a vezérlőkkel; a mentést az API 403-mal utasítja el, a lap viszont nem. A `/gephaz` lap mintája: ha a nézet nem jár a szerepnek, `redirect("/kezdolap")`.
2. A néző a `/hirfigyelo/beallitas` lapon látja a forrás-hozzáadó mezőt és gombot (szürkén, `disabled`) — a döntés: a nézőnek NEM jelenik meg (nem szürke — nincs).
3. A telefonos menüben (`FelsoSav.tsx`, `km-sav-telefon-menu`) KÉT sor viseli a „Beállítások” nevet: a `/beallitasok` (Értesítések · Adatkezelés lap, `t("nav.beallitasok")`) és a `/gephaz` (a régi Gépház, `t("nav.gephaz")`, amelynek értéke a 0064 óta „Beállítások”), az utóbbin „{n} csempe” jelvény. Az asztali sávon a harang (`/beallitasok`) az „Értesítések” címkét viseli, a `/gephaz` a „Beállítások”-at — a telefonos menü ezt kövesse.
4. A harang céllapjának (`/beallitasok`) böngészőcíme `beallitasok.oldalcim` = „Beállítások — Kommunikációs munkatér”.
5. A szerkesztő telefonos menüjében nincs Csapattagok sor, pedig a `/tagok` lap neki jár (`adat.tagok` csak a nézőnél null).

## Mit kell megírni

### 1. `apps/web/app/tema/page.tsx` (mellékelve)
A `szerep` kiszámítása után: `if (szerep !== "tulajdonos" && !fiok.rendszergazda) redirect("/kezdolap");` — egy sor megjegyzéssel: `// F9-L1: a Megjelenés a tulajdonosé (és a rendszergazdáé); szerkesztő és néző a kezdőlapra`. (A `tulajdonos` változó és minden más marad.)

### 2. `apps/web/app/feliratok/page.tsx` (mellékelve)
Ugyanez: a `tulajdonos` kiszámítása után `if (!tulajdonos && !fiok.rendszergazda) redirect("/kezdolap");` ugyanazzal a megjegyzéssel (F9-L1).

### 3. `apps/web/app/hirfigyelo/beallitas/Forrasok.tsx` (mellékelve)
A `km-hf-be-forras-hozzaad` blokk (mező + gomb) CSAK `szerkesztheto` esetén renderelődik: `{szerkesztheto && (<div className="km-hf-be-forras-hozzaad">…</div>)}`. A `hozzaadHiba` doboz és a `km-hf-be-oszinte` mondat marad mindenkinek. A mező `disabled={!szerkesztheto}` attribútuma maradhat.

### 4. `apps/web/app/_kozos/FelsoSav.tsx` (mellékelve)
A telefonos menüben (`km-sav-telefon-menu`):
- a `/beallitasok` sor felirata `t("nav.ertesitesek")` (a `nav.beallitasok` helyett); az olvasatlan-jelvény marad;
- a `/gephaz` sor felirata `t("nav.gephaz")` marad, de a `km-sav-telefon-jelveny` („{n} csempe”) span ELMARAD;
- ÚJ sor a `/fiok` sor UTÁN, ha `adat.tagok !== null`: `<Link href="/tagok" className="km-sav-telefon-link" onClick={() => setMenuNyitva(false)}>{t("nav.tagok")}</Link>` — megjegyzés: `// F9-L1: Csapattagok a szerkesztőnek és a tulajdonosnak (a nézőnél adat.tagok null)`.
Az asztali sáv NEM változik.

### 5. ÚJ migráció: `apps/web/adatbazis/migraciok/0072_f9_l4_ertesitesek_cim.sql`
Fejléc: `-- F9-L4: a harang céllapjának böngészőcíme Értesítések`. `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();` (a mellékelt 0062 minta szerint):
- `beallitasok.oldalcim`: hu „Értesítések — Kommunikációs munkatér” · ro „Notificări — Spațiu de comunicare” · en „Notifications — Communication workspace”

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0. Szerkesztővel és nézővel a `/tema` és a `/feliratok` a kezdőlapra visz; nézővel nincs hozzáadó mező; a telefonos menüben két lap nem viseli ugyanazt a nevet; szerkesztővel egy kattintás a Csapattagokhoz. Add vissza az 5 fájlt.
