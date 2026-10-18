# Feladat — ÉPÍTŐ (F9-A4): a Figyelés beállítása lap állapotai (nem mentett jelzés, Mentve-idő, üres lista, Enter, a forrás mondata)

TypeScript 7 strict, Next.js 16 app router, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza, TELJES fájltartalommal. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret (tokenőr) — csak a meglévő CSS-osztályok (`km-hf-be-uzenet`, `km-hf-be-gomb km-hf-be-gomb-szellem`, `km-hf-be-megj`, `km-hf-uzenet`, `km-hf-uzenet-gomb`). Felirat CSAK kulcsból (`t("hf.…")`), három nyelven. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. CSAK az alább felsorolt 3 fájlt adod vissza; minden más sor betűre ugyanaz marad, mint a mellékletben.

## MÉRT tények (2026-09-14, a teszten, kezdő felhasználóval)

1. A lap megnyitásakor — ha van korábbi tervezet — változtatás nélkül is „Nem mentett változások” jelvény áll (`Beallitas.tsx`: a betöltésben `if (tervezet) { setBeallitas(tervezet); setPiszkos(true); }`).
2. A mentés (`PUT /api/hirfigyelo/beallitas`) után a siker-mondat 3 mp múlva eltűnik, és utána semmi nem mutatja, hogy mentve van.
3. Üres forráslistánál (`{"forrasok":[]}`) a `Forrasok.tsx` a `hf.betoltes_hiba` („A hírfigyelő adatai nem tölthetők be…”) mondatot mutatja info-dobozban — pedig nem hiba, csak üres a lista.
4. Az Enter az „Új téma…” mezőben nem ad hozzá témát (a kezdő így tapasztalta); a kódban van `onKeyDown` Enter-ág, de nincs `preventDefault`, és a gomb `disabled` állapota nem gátolja az Entert.
5. A forrás sorában „Ezt az oldalt naponta figyeljük.” (`hf.forras_ok`) áll akkor is, ha a napi figyelés nincs bekapcsolva (`beallitas.idozites.mod === "kezi"`). A `Forrasok` komponens ma nem tudja a napi figyelés állapotát.

## Mit kell megírni

### 1. `apps/web/app/hirfigyelo/beallitas/Beallitas.tsx` (mellékelve)

- **Tervezet betöltéskor:** `setPiszkos(true)` NEM hívódik a betöltésben. Helyette új állapot: `const [tervezetVan, setTervezetVan] = useState(false)` — igaz, ha a válaszban volt `tervezet`. Ha igaz, a fejléc alatt (az „AI-javaslat sáv” ELŐTT) egy `km-hf-be-uzenet` doboz `data-fajta="info"`: `t("hf.tervezet_folytatas")` + két gomb (`km-hf-be-gomb km-hf-be-gomb-szellem`): `t("hf.folytatom")` → `setTervezetVan(false)`; `t("hf.megnezem_mostanit")` → CSAK ha `vanAktiv` (az `aktiv` beállítás a betöltésből egy ref-ben/állapotban eltéve: `aktivBeallitas`): `setBeallitas(aktivBeallitas)`, `await hfKeres("/api/hirfigyelo/beallitas/tervezet", "DELETE")`, `setTervezetVan(false)`, `setPiszkos(false)`. A `piszkos` továbbra is CSAK a `frissitBeallitas`-ban (a felhasználó változtatásakor) lesz igaz.
- **Mentve-idő:** új állapot `const [mentveIdo, setMentveIdo] = useState<string | null>(null)`; sikeres mentéskor `setMentveIdo(new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" }))`. A Mentés gomb MELLETT (ugyanabban a szülőben, a gomb után) egy `<span className="km-hf-be-megj">{t("hf.mentve_ekkor", { ido: mentveIdo })}</span>`, csak ha `mentveIdo !== null`. A meglévő 3 mp-es siker-doboz marad.
- **Enter az „Új téma…” mezőben:** `onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); temaHozzaad(); } }}`.
- **A forrás-komponensnek átadva a napi figyelés állapota:** `<Forrasok szerkesztheto={szerkesztheto} napiFigyeles={beallitas.idozites.mod === "napi"} />`.

### 2. `apps/web/app/hirfigyelo/beallitas/Forrasok.tsx` (mellékelve)

- Új prop: `napiFigyeles: boolean` (a `Forrasok` függvény szignatúrájában, az `onValtozas` mellett).
- Az `allapotAdat(f, t)` kap egy harmadik paramétert `napiFigyeles: boolean`; a `hasznalhato` ág mondata: `napiFigyeles ? t("hf.forras_ok_napi") : t("hf.forras_ok_lista")` (a `hf.forras_ok` kulcs a kódban többé nem szerepel, de az adatbázisból NEM töröljük). Minden hívóhelyen a harmadik paraméter átadva.
- Üres lista: a `csoportok.length === 0` ág mondata `t("hf.nincs_figyelt_oldal")` (marad `km-hf-be-uzenet` `data-fajta="info"`).
- A forrás-hozzáadó mező Enter-ága: `e.preventDefault()` az Enternél, a meglévő `void hozzaad()` előtt.

### 3. ÚJ migráció: `apps/web/adatbazis/migraciok/0070_f9_a4_beallitas_allapotok.sql`

Fejléc: `-- F9-A4: a Figyelés beállítása lap állapotainak feliratai`. Egy `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();` (a mellékelt 0062 minta szerint) ezekkel:
- `hf.tervezet_folytatas`: hu „Van egy korábban elkezdett beállításod, amely még nincs használatban.” · ro „Ai o setare începută mai devreme, care încă nu este folosită.” · en „You have a setup you started earlier that is not in use yet.”
- `hf.folytatom`: hu „Folytatom” · ro „Continui” · en „Continue”
- `hf.megnezem_mostanit`: hu „Megnézem a mostanit” · ro „Văd setarea actuală” · en „Show the current one”
- `hf.mentve_ekkor`: hu „Mentve {ido}” · ro „Salvat la {ido}” · en „Saved at {ido}”
- `hf.nincs_figyelt_oldal`: hu „Még nincs figyelt oldal.” · ro „Încă nu urmărim niciun site.” · en „No sites are being monitored yet.”
- `hf.forras_ok_napi`: hu „Ezt az oldalt minden reggel átnézzük.” · ro „Verificăm acest site în fiecare dimineață.” · en „We check this site every morning.”
- `hf.forras_ok_lista`: hu „Ez az oldal a figyelési listádon van.” · ro „Acest site este pe lista ta de urmărire.” · en „This site is on your watch list.”

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0. Megnyitás + kibontás nem hoz létre „Nem mentett” jelvényt; mentés után a gomb mellett „Mentve HH:MM”; friss munkatérrel nincs hibaüzenet az üres listánál; Enter hozzáadja a témát; a forrás mondata a napi figyelés állapotából beszél. Add vissza a 3 fájlt.
