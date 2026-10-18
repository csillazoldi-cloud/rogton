# Machinery — R-17 · tester feedback round (2026-10-06)

Every new control on `rajz/R17-lapok.dc.html` mapped to its machinery. **Existing** = an endpoint or behaviour that is live today
(read from the code at main fc3e289, not measured on the test site). **NEW** = has to be built; nothing ships without it (rulebook 4: no dead controls).
Labels: `feliratok.json` (`r17.*`, hu · ro · en → one new migration). Reused keys are listed per row.

## A · Arculat sub-pages (R-16)

| On the drawing | Machinery |
|---|---|
| A1–A7, B1, B2: „‹ Logó, színek, betűk” top-left on the Logók (12f, 12f0), Színek (12d), Más szín (12d2/12d3), Betűk (12e) and Névlogó (12g) pages and the logo questionnaire (12h) | navigation → `/fiok/arculat`. Text = existing key `r16.arculat.szakasz`. On 12f/12f0 it **replaces** the quiet bottom „Vissza” (`r16.arculat.vissza`) — same action, moved up (Kati #13). On 12d/12d2/12e/12g the existing „Mégse”/„Inkább feltöltöm” stay (kerdesek 3). |
| A1 12f primary „Kész” (`r17.arculat.logok.kesz`) once ≥ 1 logo slot is filled | navigation → `/fiok/arculat`. No save call: uploads already save on drop/pick (`POST /api/arculat/logok`, existing). Before the first logo the primary stays „Logók kiválasztása” (multi-file picker, existing). |
| A2 12f2 tapping a filled slot: selected outline + the preview switches | client state only. Slot → preview: `vilagos`/`sotet`/`egyszinu` → today's `IgyNezKi` two samples rendered in that variant (existing image maker, new `valtozat` input = the slot); `negyzetes` → **NEW** profile-picture mock (cover + round avatar with the square logo), client-side component, no endpoint. Label `r17.arculat.logok.igy_profilkep` only for the square. |
| A5 12d2 „Pontos kódom van” (`r17.arculat.szin.pontos_kod`) | client: opens the code field in place (12d3). Same on the Fő / Második / Háttér tabs. |
| A6 12d3 code field (`r17.arculat.szin.kod_cimke` aria, hint `r17.arculat.szin.kod_sugo`) pre-filled with the tab's current colour | **NEW parsing, existing save.** Client parses `#RRGGBB`, `RRGGBB`, `#RGB`, `R, G, B`, `rgb(R,G,B)` → normalised `#RRGGBB`; on a valid value the ring centre and the sample image update live (same path as touching a swatch today). Save = the existing primary „Ez legyen” → `POST /api/arculat/szinek` with `forras: "sajat"` (the schema already takes any `HexSzin`). Invalid input: one sentence under the field (**NEW** key needed: `r17.arculat.szin.kod_hibas` — not drawn, kerdesek 7), colour does not change. |
| A8 12a phone: „Aa” + mood name (`r16.arculat.betu.eros`, `r16.arculat.betu.tiszta` — existing keys, same words as desktop „Cím: Erős”) | data already on the page (`adat.betuk.cimSzo` / `szovegSzo` in `ArculatSzakasz` / `NevlogoNyito`); only the phone markup changes. |
| A9 12b phone: all uploaded logo versions as 48 px tiles; row label `r16.arculat.logok` | data already loaded (`adat.logok`, `LOGO_SORREND`); today the `!kesz` branch renders one tile (`EGY_LOGO_SORREND`) and hides „Több logó” on phone. Change: render `kitoltott.map(logoCsempe)` on phone (as in the 12c branch). |

## B · Paid logo design

| On the drawing | Machinery |
|---|---|
| B1 12g quiet button „Tervezzünk neked logót — {ar}” (`r17.logoterv.gomb`) | **NEW setting** read server-side: system-wide `logoterv_ar` (number, EUR; default 79). Empty/0 → the button is not rendered. Click → `/fiok/arculat/logoterv` (12h). The existing primary „Ez legyen” is unchanged (T2). |
| B4 admin, Beállítások (Gépház) → Rendszer: „Logótervezés ára” (`r17.admin.logoterv_ar`, `r17.admin.logoterv_ar_kov`), number + EUR + Mentés (`r13.kozos.mentes`) | **NEW** `GET/PUT /api/admin/logoterv-ar` (rendszergazda only; 400 on negative / non-number). Stored in a system settings table (or the existing árfolyam/config table if there is one — check before adding). Tibor-exempt view. |
| B2 12h questionnaire: 4 text fields + 5 „hol” toggles; pre-filled | Pre-fill: `nev` = organisation name; `mivel` = profile summary, shortened (existing profile data); `hangulat`, `szinek` = **NEW** small machine suggestion from the approved Arculat (mood words + current colour names) — may also be a plain template from existing data, no AI call needed. „hol” default: Facebook + Honlap + Autó, ruha (kerdesek 8). |
| B2 „Van egy minta, ami tetszik” (`r17.logoterv.minta`) | file picker → existing upload store (`fajl-core`, same as the Arculat „Fájlok” → minta), files linked to the request. |
| B2 primary „Elküldöm” (`r17.logoterv.elkuldom`) | **NEW** `POST /api/logoterv` → stores a request row (**NEW** table `logoterv_keres`: id, szervezet_id, fiok_id, ar_eur at the time, the 5 answers as JSON, file ids, letrehozva, allapot `uj/folyamatban/kesz`; tenant-separated, RLS as every tenant table — A-11) → **NEW** notification to the recipient (kerdesek 1: e-mail and/or hub feedback and/or the admin list) → shows 12h2. Price shown on the page is the setting's current value; the row keeps the value at send time. |
| B2 info „Ára: {ar}. Előbb felhívunk, és megbeszéljük.” (`r17.logoterv.ar_sor`) | text only; the promise in it is a proposal (kerdesek 2). |
| B3 12h2 „Megkaptuk, köszönjük!” · ✓ „Hamarosan jelentkezünk.” · info „Addig a névlogód marad a képeiden.” · primary „Rendben” (`kozos.rendben`) | navigation → `/fiok/arculat`. Nothing else changes: the name logo stays in use. |

## C · Posztszöveg: „Blog / honlap”

| On the drawing | Machinery |
|---|---|
| C1 fourth tab „Blog / honlap” (`r17.poszt.felulet_blog`) | **NEW surface value** `blog`: `PosztFelulet` in `packages/contracts` (`["fb","ig","li"]` → + `"blog"`), `R15Felulet` in `apps/web/r15/tipusok.ts`, `FELULETEK` in `R15Poszt.tsx`, the cell storage (check whether the DB column has a CHECK list — none found in the migrations by grep). Phone: the four tabs size to their text (`flex: 1 1 auto`). |
| C2 title line „A cikk címe” (`r17.poszt.cikk_cim`, aria) above the body | **NEW field** `cim` on the cell (only for `blog`); generated together with the body; saved with the same `PUT /api/poszt/{id}` autosave (body + `cim`). „Kész, másolom” copies `cim + "\n\n" + szoveg`. |
| C2 body: longer article, no hashtags | **NEW prompt branch** in `prompts/poszt_szoveg.hu.md` (or a sibling `poszt_cikk.hu.md`): website news article, 4–8 short paragraphs with optional sub-heads, title ≤ 90 characters, target ≈ 1 500–2 500 characters, **no hashtags, no emoji**; all v5 rules stay (own voice, no offers, no invented numbers/prices/dates, place names in target-language form). JSON: `{"cim":"…","szoveg":"…","rovid_nev":"…","rovid_cim":"…","otlet":"…"}`. The rewrite buttons (Rövidebben · Közvetlenebbül · Új változat · Továbbiak) and Más nyelven / fordítás take the same `blog` surface (prompts `poszt_atiras`, `poszt_forditas` get the title too). |
| C2 quiet counter „{n} / kb. {hatar} karakter” (`r17.poszt.karakter_blog`) | client count of `cim + szoveg`; `hatar` = 2 500 (constant, kerdesek 6). Soft: never blocks copying; no colour change above the limit (T7). |
| C2 preview „Így fog kinézni”: a simple website-article card (site bar with the org's domain, image slot with „Kép készítése”, title, date, first paragraphs) + info „Az első bekezdések látszanak.” (`r17.poszt.cikk_elonezet_info`) | **NEW** `R15Elonezet` variant `blog`; domain from the profile's website field (existing); image slot = the existing `R15KepAlatta` / „Kép készítése” flow (image format: landscape — kerdesek 6). |

## D · Public landing page: first-visit language

| On the drawing | Machinery |
|---|---|
| D2 page language | **Existing:** `nyelvKeresbol(cookie km_nyelv, Accept-Language)` in `apps/web/nyelv/index.ts` → cookie, else the first HU/RO/EN in `Accept-Language`, else `ALAP_NYELV` (hu). |
| D1 the chooser (only when unclear) | **NEW:** `nyelvKeresbol` returns whether the language was *decided* (cookie or a HU/RO/EN match) or *defaulted*; only on the public landing page, when defaulted, render the chooser strip under the header. The trilingual line reads `r17.nyelv.valaszto_cim` from all three bundles; the buttons use the existing `nyelv.hu` (from hu), `nyelv.ro` (from ro), `nyelv.en` (from en) — each in its own language. |
| D1 a choice | **Existing** `POST /api/nyelv { nyelv }` → sets `km_nyelv` (1 year) → page refresh in that language; the chooser is never shown again while the cookie lives. |
| D2 quiet switcher in the header („Magyar ▾”, phone „HU ▾”) | **Existing** `Nyelvvalaszto` (`km-ny-nyelv`), restyled quieter (no border, muted text). |

## Not drawn, needed by the machinery above
- `r17.arculat.szin.kod_hibas` (invalid code sentence) — kerdesek 7.
- An admin list of incoming logo requests — depends on kerdesek 1.
