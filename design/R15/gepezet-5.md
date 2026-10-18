# Machinery — R-15 c5 Round 2 (09–10 Képek · 12 Szervezet adatai · 13 Beállítások · 14 Értesítések · 03 „Tegnap javítva”)

What each drawn element uses. Drawing: `rajz/R15-lapok-5.dc.html` (13 sections, 26 screens). Labels: `feliratok-6.json` — 21 NEW keys
(hu/ro/en; 3 of them are not drawn but used by the code: `r15.sz.honnan_weboldal`, `r15.sz.honnan_gep`, `r15.ert.kerdes_egy` for n = 1), no changed values → one new migration in the code round. Every other string on the drawing is an EXISTING label key
(114, `data-felirat` on each element) with today's value, read from the migrations (latest value wins), not retyped.
Measured in code on main `6c1eea5` (2026-10-10) and on a local production build of it; nothing here was run against the live site.

Route map (measured — the probe tool uses the same): 09 = `/kepek` (`Helyzetek.tsx`) · 10 = `/kepek/uj/[helyzet]` (`Kitolto.tsx`) ·
12 = `/fiok` (`Fiok.tsx`; `apps/web/app/szervezet` only holds `/szervezet/uj`) · 13 = `/gephaz` (`Gephaz.tsx`) ·
14 = `/beallitasok` (`Beallitasok.tsx`) · 03 = `/kezdolap` (`R15Kezdolap.tsx`).

Legend: **same** = existing machinery, presentation only · **NEW client** = small client logic on existing data/endpoints ·
**NEW read** = a new server-side read of existing data (no migration, no new table).

## 1. 09 Képek (`/kepek`) — same
- 7 situation cards → `/kepek/uj/<h>` (`?poszt` passthrough unchanged), sample images `/api/vizual/helyzet-minta/<h>` unchanged.
- Primary „Képet készítek a munkámról” (`r15.kozos.kepet_keszitek_munka`, existing key) → `/kepek/uj/kesz` — the same link as the card.
- Phone: descriptions hidden by CSS only; primary in the R-15 bottom bar (`r15-also-sav`), Visszajelzés row above it (fixes today's T10 overlap).
- Unchanged and conditional (not on this org's screen): the „no arculat” line (`vz2.arculat_nelkul` + link `/fiok`), the „Szöveges képek” row (csomag kozlekedes).

## 1b. Sample photo (Csilla 18:08)
- The c14/c15 trade sample photo (`apps/kepgyar/src/minta-foto.ts`, by the stored trade category) now also goes on the `uj` (Újdonság) sample,
  not only `kesz` — 09 shows no striped placeholder. The kitöltő image (`POST /helyzet`) is unchanged: there the photo is the user's own upload.

## 2. 10 Kitöltő (`/kepek/uj/[helyzet]`) — same + one NEW client condition
- Header: „← Másik kép”, title `vz2.h_<h>`, subtitle `vz2.megirtuk` (moved from the top of the form to under the title). Right: halk
  „Poszthoz teszem” (`poszthozTeszem`, R-15 08c) + primary „Letöltés” (`letolt`). Opened from a post: unchanged 08c pair.
- Photo row, fields (`KERDESEK`), „Román változat is” switch, drag/zoom, hide/show image: unchanged.
- **NEW client:** „Így jó: {pelda}” renders only when the field is empty (kerdesek-5 · 3).
- Size radios (`vz2.meret_*`): presentation only — 2 px `--primary` edge + tinted fill + ✓ on the checked one.
- Colour variants (`vz3.*`, `/api/vizual/helyzet-valtozatok`, `/api/vizual/valtozat`): unchanged, shown under the image.
- **10w working state** = today's `kep === "keszul"`: the primary becomes the R-15 `DolgozoGomb` (spinner + `r15.kep.keszitjuk`, disabled,
  aria-busy) with `r15.kozos.par_masodperc` beside it; the image stays visible at 45 % with a spinner. `kep === "hiba"` keeps today's
  `vz2.kep_hiba` + „Újra” over the image (not drawn again). The „nem fér ki” hint (`vz2.rovidits*`) still disables Letöltés with its reason.
- **10b done state** (`kesz`): same data — image + „Letöltés újra” / „Mindhárom méret”; title `vz2.kesz_cim` + `vz2.kesz_letoltve_asz`
  (phone: `vz2.kesz_letoltve`, and the title now also on the phone; „Letöltés újra” also on the phone, Csilla 18:08); „Mit írj mellé?” + `/api/vizual/melle` text + primary „Szöveg másolása”
  (clipboard); `vz2.igy_fb` / `vz2.igy_story` by size; links „Még egy képet” / „Ugyanezt más méretben”. The `jelzes.javaslat` badge is not rendered.

## 3. 12 Szervezet adatai (`/fiok`) — same data, presentation
- Rows = today's `MEZOK` (`nev, tevekenyseg, celkozonseg, cel, nyelvek, hangnem`) with `mezo.*` labels, in today's two groups. Values as
  `data-r15="eredmeny"`. Empty → `onboarding3.kesobb` + „Megadom”.
- „Átírom”/„Megadom” = today's „Szerkesztés” (owner only, `szerkesztheto`); the editor, validation (`fiok.nyelv_legalabb_egy`,
  `fiok.hangnem_tul_hosszu`), save and „Mégse” are unchanged. In the editor: one source sentence from today's `forras` value
  (`sajat` → `r15.sz.honnan_sajat`, `weboldal` → `r15.sz.honnan_weboldal`, `ai` → `r15.sz.honnan_gep`; no sentence when empty) and
  `fiok.mentes_kovetkezmeny` under Mentés. Phone: the whole row opens the editor (› instead of the word).
- `fiok.jovahagyva_datum` as a quiet line (no badge). Primary „Logó és színek” (`r15.sz.arculat_gomb`) → `/fiok/arculat` (today's „Megnyitás”).
- Not rendered: the source badges (`jelveny.*`), the eredet detail panel. The `onboarding3.eredet_megj` footnote is replaced by ONE line under the list,
  `r15.sz.ai_nem_teny` „Az AI javaslata nem tény.” (Csilla 18:08, Q6 changed). Data unchanged.
- Non-owner: same rows without „Átírom/Megadom”, `fiok.csak_tulajdonos` under the title (as today).

## 4. 13 Beállítások (`/gephaz`) — same + NEW read + NEW client
- Rows: Szervezet adatai → `/fiok`; Megjelenés → `/tema`; Csapattagok → `/tagok`; Haladó ▾ (client toggle): Pénznem (today's select,
  owner-only `PUT /api/beallitas/penznem`), AI-használat → `/koltseg` (shown when today's `nezet.koltseg` is not null), Kapcsolat más rendszerekkel →
  `/gephaz/kimeno`, Felület szövegei → `/feliratok`. The rendszergazda „Rendszer” group + `LogotervSorok`: unchanged, rendszergazda only, with its badge and intro.
- Trial line `r15.be.proba_sor` replaces the „Csomag: …” row and the pricing box (shown while `nezet.csomag` is the trial, as today).
- **NEW read:** the credit line uses the existing `sajatKredit(szervezetId, fiokId)` (kredit module, R-13) on the server; `r13.kezdolap.kredit_sor`
  `{maradt}/{havi}`; „Mire ment el?” → `/sajat-fiok` (existing R-13 page). When credits are not set up for the org, the row is not shown.
- **NEW client (5):** primary „Meghívok valakit” → `/tagok?meghivo=1`; `Tagok.tsx` opens its existing invite dialog when the parameter is present
  and `meghivoJog` is true (otherwise the page opens normally). Phone: primary in the bottom bar.

## 5. 14 Értesítések (`/beallitasok`) — same + NEW client
- Tabs Értesítések / Adatkezelés unchanged (Adatkezelés tab not redrawn — kerdesek-5 · 13).
- Title from today's `lista.olvasatlan`: > 0 → `r15.ert.kerdes_uj` `{n}`; 0 → `r15.ert.kerdes_nincs` + `r15.ert.nincs_alcim`.
- Rows = today's `ErtesitesSorKomponens` (time, `ertesites.esemeny_*` text, `ertesites.megnyitas` / `ertesites.teendo_forras` →
  `/beallitasok/nyit/<id>`), unread dot from `olvasott`. „Mind olvasottnak jelölöm” = `POST /api/ertesites/olvasott`.
- **NEW client:** primary „Megnézem a legújabbat” = the link of the newest unread row; empty → „Vissza a Kezdőlapra” (`/kezdolap`).
- „Miről szóljon ▾” (client toggle): today's switches (`ERTESITES_FAJTAK`, `PUT /api/ertesites/sajat`; rendszergazda's `belepesi_kiserletek`
  as today). Only change: `keret_kimerult` shows `r15.ert.keret_cim` („Elfogyott a havi kredit”). `ertesites.csatorna_mondat` above them.
- „A felületen” (`beallitas.feluleten`, a live switch) is the first switch behind „Miről szóljon ▾” (build correction 10-10).
- Not rendered: the E-mail and Telefon rows (dead), `ertesites.lista_szam`, `beallitasok.cim` + `beallitasok.bevezeto`.

## 6. 03 Kezdőlap — „Tegnap javítva” (c7) — NEW read
- **Measured machinery:** `visszajelzes.kesz_ido` (0154) is set when an item becomes „kész” (kept on repeat, cleared when moved back —
  `c1c7-ertesitesek.proba.ts`); rows carry `fiok_id`, `nevtelen`, `szervezet_id`, `szoveg`, `lap`, `lap_cim`. The 09:00 Telegram job
  (`ertesites.ts › keszVisszajelzesek`) reads all items fixed in a window — it is NOT per person and nothing per person reaches the app today.
- **NEW read (no migration):** in the visszajelzes module's public API, e.g. `sajatJavitott(fiokId, szervezetId, tol)` →
  `allapot = 'kesz' AND kesz_ido > now() - 24h AND fiok_id = $me AND nevtelen = false AND szervezet_id = $org`, newest first, at most 5 —
  only the caller's own rows (A-11 holds: organisation-scoped, person-scoped). Called by `/kezdolap/page.tsx` next to the existing data.
- **Bar item:** only when the read returns ≥ 1 row: ✓ + count before „Értesítések” (desktop) / before the notification badge (phone),
  `r15.kezdolap.javitva_sor` `{n}` as tooltip + accessible name. Click → client drop-down (heading = the same sentence; items = „„szöveg””,
  `lap_cim` when stored, „Megnézem” → `lap`). `lap` is rendered as a link only when it is an internal path (starts with `/`, not `//`).
- Nothing else on 03 changes (the drawn 03b is the approved one, byte for byte, plus the item).

## Security-relevant surface (FYI Vilmos — no auth / permission / RLS / secret change)
- The c7 read returns only the caller's own, non-anonymous feedback rows of the current organisation (person + tenant filter in SQL).
  The text is the person's own words; `lap` links are restricted to internal paths.
- `/tagok?meghivo=1` only opens the dialog the user can already open; the permission check (`meghivoJog`, server-side invite rules) is unchanged.
- `/gephaz` credit line: an existing organisation-scoped read (`sajatKredit`) for the logged-in member.
