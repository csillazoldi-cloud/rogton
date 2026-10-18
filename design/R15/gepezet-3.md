# Machinery — R-15 utókérés 2 (03c2 · 04a) and 4th shipment (06 Mit figyeljünk), plus R-16 12a phone / 12f0

What each drawn state needs. Continues `gepezet.md` and `gepezet-2.md`; nothing there is removed unless stated here.
Drawings: `rajz/R15-lapok-2.dc.html` (03c2, 04a), `rajz/R15-lapok-3.dc.html` (06a, 06b + component panels),
`../R16-arculat/R16-arculat.dc.html` (12a phone, 12f0). Labels: `feliratok-3.json` (→ migration 0142).

## 1. 03c2 Kezdőlap — nothing waiting, nothing finished this week
State = gepezet-2 · 2, third branch (N = 0 and nothing finished this week); live `allapot === "munkad"`. No new data.
- Title `r15.kozos.munkad_cim` (unchanged). Subtitle = `r15.kozos.foto_munka` (new value: the outcome + "kiteszed, ha tetszik").
- Next to the sample image: `r15.kozos.minta_sor` instead of `r15.kezdolap.kesz_ajanlat` (that key stays for the 03c done state).
- Sample image: no caption at all (alt text `r15.kozos.kep_minta_alt` unchanged).
- Watch row (`napi_figyeles` list item): label + `r15.kozos.mi_ez` link. "Mi ez?" expands in place (no navigation) to
  `r15.kozos.napi_hirek_reszlet` + link `r15.kozos.mit_figyelunk` → `/hirfigyelo/beallitas`. Text only; the toggle action is unchanged.
- Phone: no halad line in this state (as live today); "Még 1 apróság" unchanged.

## 2. 04a Hírek — no new news today
- Subtitle = `r15.hirek.ures_ajanlat` (new value: "Ma a legutóbbi munkádból csinálunk képet."). The offer card has no title any more;
  desktop card = sample image + `r15.kozos.foto_munka` + primary; phone = sample image only (40-word budget), primary in the bottom bar.
- Under the card one quiet link row: `r15.hirek.miert_nincs` · `r15.hirek.keress_most` · `r15.hirek.beallitasok` (phone: only "Miért nincs ma hír?" is above the fold).
- "Miért nincs ma hír?" expands in place to:
  1. `r15.hirek.kihagytuk` (new value, same `{n}` = skipped count of the last gathering, as today);
  2. `r15.kozos.legutobb` (existing `utolso_kereses_nap`);
  3. weekly counter: if `poszt_kesz = 0 AND kep_letoltve = 0` → `r15.kozos.halad_ures`; otherwise the visible halad bar under the title as drawn in round 2 (`r15.kozos.halad_rovid`) — i.e. **the counter is hidden on the page only in the 0/0 case**;
  4. watch row: OFF → "Friss hírek minden reggel · Bekapcsolom · Mi ez?" (same PUT `/api/r15/napi-figyeles`); ON → `r15.hirek.holnap_ujra`.
- First gathering still running: title `r15.hirek.elso_kerdes`, no subtitle (unchanged from gepezet-2 · 5).
- Reason for moving the counts and the watch row behind the link: measured, see `RAJZ-MEASURED.md` §2 (visible → 4 points 3/3; behind the link → 5 points 4/4).

## 3. 06 Mit figyeljünk (`/hirfigyelo/beallitas`) — full redraw
All existing API calls stay (`/api/hirfigyelo/beallitas`, `/tervezet`, `/javaslat`, `/forrasok…`, `/futas`). Only presentation and one chained action change.

1. **Frame.** On this page the `HirfigyeloKeret` tab row ("Hírek · modul · Áttekintés · Hírfigyelés beállítása · Találatok pontosítása") is not rendered.
   Áttekintés = nav "Hírek"; Pontosítás = link `r15.mit.mit_talaltunk` → `/hirfigyelo/finomhangolas` (desktop: visible; phone: inside Részletek).
   `/hirfigyelo/finomhangolas` keeps its tab row until that page is redrawn. The words "modul", "v{n}", "Pontosítás" appear nowhere on 06.
2. **State.** `beallitas.idozites.mod !== "napi"` → 06a; `=== "napi"` → 06b. Viewer role (`szerep === "nezo"`) → info `r15.mit.csak_nezed`, no "Átírom", primary = `r15.mit.mai_hirek`.
3. **Card (read-only by default).** Témák = `beallitas.temak[].nev` as plain chips; Oldalak = all `forrasok` in one list (kézi first, then `ai_javaslat`),
   no group titles. A source row shows a second line ONLY when not `hasznalhato`:
   `ellenorzes_alatt` → `r15.mit.ellenorizzuk`; `hibas` → `r15.mit.oldal_nem_nyilt`; `nem_tamogatott` → `r15.mit.nem_figyelheto`;
   `korlatozott` → existing `hf.forras_korlatozott` (not redrawn; kerdesek-3 has no question on it — keep as is).
   The old "AI-javaslat — ellenőrzés előtt…" warning merges into the `ellenorizzuk` line. No line for a healthy source (T3: no source status).
4. **"Átírom" → edit mode in place** (drawn as "„ÁTÍROM” UTÁN" panel). Shows chip × (`temaTorles`), "+ Új téma" (existing `temaHozzaadas` validation and messages),
   "+ Új oldal" (existing `hozzaad`; at the limit the link is replaced by `hf.forras_korlat_mondat`), per-row "···" menu:
   header `r15.mit.utoljara` (from `utolso_sikeres`), `hf.forras_ujraprobalas` (only if not `hasznalhato`), `hf.forras_cim_modositas`, `hf.forras_eltavolitas` → confirm `r15.mit.eltavolitas_kerdes`.
   "Kész" (`r15.mit.kesz`) closes edit mode. Autosave after 800 ms exactly as today; there is no Save button any more (kerdesek-3 · 5).
5. **Primary 06a "Jó így, kezdjük" (`r15.mit.jo_igy`) — chained action (new client logic, existing endpoints):**
   (a) flush the save queue (`mentes`); if `beallitasEllenoriz` fails → baj `r15.mit.hianyzik` + "Átírom";
   (b) if no finished trial in this session/at all → POST `/api/hirfigyelo/futas {proba:true}`, wait (`varjSor`); button shows `r15.mit.bekapcsoljuk`, disabled;
   on failure → baj `r15.mit.inditas_hiba` + `hf.ujra`;
   (c) set `idozites.mod = "napi"` and save (same as today's `napiBekapcsol`) → page switches to 06b.
   Needs: the "trial already done" flag (today only in component state `probaAllapot`; the code round must read it from the last `futas` row — assumed to exist, not measured).
   Desktop info next to the button: `r15.mit.holnap_jonnek` (phone: omitted, word budget).
6. **Primary 06b** `r15.mit.mai_hirek` → link to `/hirfigyelo`.
7. **Részletek (in place, both widths)** — everything else from today's page:
   own name (`sajatNevMod` radios `r15.mit.csak_cegrol` / `r15.mit.rolam_is` + name field), the four Pontosítás fields
   (`nevvaltozatok` → `r15.mit.mas_neven`, `foldrajzi_fokusz` → `r15.mit.hol`, `kizarasok` → `r15.mit.nem_erdekel`, `megkulonboztetes` → `r15.mit.ha_mast_jelent`),
   texts `r15.mit.mi_tortenik`, `r15.mit.korlat` (`{cikk}` = `HF_NAPI_CIKK`, `{nap}` = `HF_CIKK_MAX_KOR_ORA / 24`), `r15.mit.oszinte`,
   `r15.mit.oldal_szamlalo` (`{n}`, `{m}` = `forras_max`, `{szabad}`), `r15.mit.holnaptol`,
   "Keress most" (`r15.mit.keress_most` = today's trial run; progress `r15.mit.keresunk` from `haladas.forrasok_letoltve/osszes`; done `r15.mit.kereses_kesz`),
   `r15.mit.mit_talaltunk`, "Mást javasolj témának" (`r15.mit.mast_javasolj` = `javaslatKeres`), `r15.mit.mentve` (`{ido}` = `mentveIdo`).
   The version number stays in the API/DB; it is not shown anywhere.
8. **Rarer states** (drawn in the "RITKÁBB ÁLLAPOTOK" panel, one quiet line above the card unless it is a real error):
   draft (`tervezetVan`) → `r15.mit.felbehagytad` + `hf.folytatom` / `r15.mit.a_mostanit`; first open while the suggestion runs → `r15.mit.javaslunk`, card placeholders, primary disabled;
   suggestion failed → baj `r15.mit.javaslat_hiba` + `hf.ujra`; save failed → baj `r15.mit.mentes_hiba` + `hf.ujra`.
9. **OFF switch for the morning watch** — none existed (measured in code: only `PUT /api/r15/napi-figyeles` turned it on). **Decided 10-01 (Csilla, kerdesek-3 · 3):**
   build it inside Részletek, shown only while the watch is on (06b): halk gomb `r15.mit.reggeli_ki` → `DELETE /api/r15/napi-figyeles`
   (same endpoint and permission as the PUT; sets `idozites.mod = "kezi"`, new settings version) → the page switches back to 06a.

## 4. R-16 phone empty states
- **12a phone** (org has no logo): on page open the three name-logos are generated with the existing c10 / 12g machinery (`nevlogo.ts`, three styles) from the org name,
  current colours and title font; first style pre-selected. "Ez legyen a logóm" = the 12g "Ez legyen" action (fills all four slots).
  "Van saját logóm" → `/fiok/arculat/logok?van=1` (12f0 skipped, picker opens). "Most logó nélkül" = the existing "Így jó, logó nélkül" action.
  Colour/font "Csere" → 12d / 12e as today. Fonts are shown as "Aa" in the chosen fonts (names only in 12e).
- **12f0** (zero logos and no `?van=1`): choice state is client-side; default "Nincs". Primary label follows the choice;
  "Nincs" → `/fiok/arculat/nevlogo` (12g); "Van" → the existing multi-file picker (`r16.arculat.logok.valasztas`), then 12f.
- Desktop 12a / 12f unchanged.
