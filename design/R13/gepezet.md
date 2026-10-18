# Machinery — R-13 · credit and per-account news selection (13a · 13b · 13c · 13d) — round 3

Every drawn control mapped to the machinery in `design/DESIGN-KERES-R13.md` §2. Drawing: `rajz/R13-lapok.dc.html`.
Labels: `feliratok.json` (76 `r13.*` keys, hu · ro · en → one new migration). Round 3: the round suffixes are gone; the credit-split
view has its own prefix `r13.kreditek.*`. The money line (Csilla/Vilmos 10-03): `r13.kredit.penz_keret` · `penz_oszt` · `penz_elfogyott` · `penz_rovid`. Reused existing keys are listed at the end.
Round 2 rule (after the Sonnet judge): **no settings form with a Mentés button.** Choices sit behind "Átírom", open in place and
save themselves on every change (same pattern as the approved 06 Mit figyeljünk). Nothing on the drawing is without machinery;
text-only disclosures ("Részletek", the Átírom panels' explanations) need no endpoint.

## 13a · Saját fiók (`/sajat-fiok`) — new sections on top, R-3 v2 blocks unchanged below

| On the drawing | Machinery |
|---|---|
| Title `r13.szures.cim` „Ilyen hírekből írunk neked posztot” + `r13.szures.alcim` (= the "Hírek szűrése" section) | — |
| Summary card, line 1: `r13.szures.{fokozat}_konkret` with `{hely}` and `{temak}` | `GET /api/hirfigyelo/sajat-szures` (fokozat) + place and topics read from today's `GET /api/hirfigyelo/beallitas` (read only) |
| Summary card, line 2: előválogatás ON `r13.szures.elo_be_sor` · OFF `r13.szures.elo_ki_sor` + `r13.szures.elo_ki_kov` („Így kb. hétszer több kredit fogy.”, quiet — T7: not a real problem yet) | same GET (`eloszures`) |
| Átírom → panel: three radios with their sentences (`r13.szures.{f}` + `_mondat`) and the „Gyors előválogatás” switch with the 7× sentence (`r13.szures.elovalogatas_be/_ki`), Kész, `r13.kozos.automentes`, `r13.szures.reszlet` | `PUT /api/hirfigyelo/sajat-szures` on every change (`fokozat`, `eloszures`); Kész only closes the panel |
| Primary „Megnézem a mai híreket” (`r15.mit.mai_hirek`) | navigation → `/hirfigyelo` (06b's primary) |
| Quiet line `r13.kezdolap.kredit_sor` + Részletek + money line `r13.kredit.penz_keret` (desktop) | `GET /api/kredit/sajat` → maradt, havi; Részletek opens the Kreditjeid section in place: number, bar, `r13.kredit.mi_az`, `r13.kredit.penz_keret`, „Elment rá:” max 4 rows (`GET /api/kredit/sajat` → mire ment el) |
| Phone: credits below the fold (continuation frame „TELEFON · LEJJEBB GÖRGETVE”); strip info `r13.szures.nincs_dolgod` | same GET |
| 13a3 own credit used up: title `r13.kredit.elfogyott_cim`, alcím `r13.kredit.elfogyott_alcim`, primary `r13.kredit.kesz_posztok` → `/poszt`, info `r13.kredit.ha_most_tulajdonos` (owner) / `r13.kredit.ha_most` (szerkesztő, néző: „…szólj a munkatér tulajdonosának.”) | `GET /api/kredit/sajat` maradt = 0; role from the session |

Defaults: a new account = nagyon szigorú + ON (GET returns this). The skipped news list is never shown (Vilmos); the word list is not drawn.

## 13b · Tagok (`/tagok`) + the Kreditek view (`/tagok/kreditek`) — round 3 structure (Csilla 10-03)

The Tagok first screen stays R-2 (members, roles, Meghívás) with **no credit columns**; one quiet row „Kreditek ›” (owner only) opens the
credit-split view. The view uses the same endpoints as before; the link itself needs no new machinery.

| On the drawing | Machinery |
|---|---|
| 13b0 Tagok: title `r13.tagok.cim`, alcím `r13.tagok.alcim`, member rows (name, role), ··· (`r13.tagok.tobbiek`: Szerep, eltávolítás), primary `r13.tagok.meghivok`, info `r13.tagok.visszavonhatod` (true: R-2 Visszavonás) | R-2, unchanged: `GET /api/tagok` · `PUT/DELETE /api/tagok/{fiokId}` · `POST /api/tagok/meghivo` |
| 13b0 row `r13.kreditek.link` + `r13.kreditek.link_info` „Mindenki egyenlő részt kap ›” (owner only) | navigation → `/tagok/kreditek`; the small text from `GET /api/kredit/tagok` (whether anyone has a separate amount) |
| Kreditek: back link `r13.kreditek.vissza` (desktop), title `r13.kreditek.cim`, alcím `r13.kreditek.alcim` (`{havi}`; phone `r13.kreditek.alcim_rovid`) | `GET /api/kredit/tagok` → havi összeg |
| Kreditek rows: name, role, `r13.tagok.kredit_db`, `r13.tagok.kulon_jel`; per row Átírom (`r15.mit.atirom`) or `r13.tagok.vissza_egyenlo` | `GET /api/kredit/tagok` → tagok[]; Átírom opens the row in place (panel): number field (grey = equal share), maradt, elhasznált, R-2 Szerep · Eltávolítás → `PUT /api/kredit/tagok/{fiok}` on change, no Mentés |
| Kreditek 13b1/13b2 primary „Jó így” (`r13.kozos.jo_igy`) + money line `r13.kredit.penz_oszt` (phone `penz_rovid`) | no data change (everything saved already) → back to Tagok |
| Kreditek 13b3: title `r13.kreditek.elfogyott_cim`, alcím `r13.kreditek.elfogyott_alcim`, table Havi kredit · Elhasznált · Maradt (0 in warn), primary `r13.kreditek.tobbet_adok`, money line | opens Szabó Anna's row (Átírom) → `PUT /api/kredit/tagok/{fiok}` |
| 13b4 alone (on Tagok): title `r13.tagok.egyedul_cim`, card `r13.tagok.egyedul_alcim`, primary `r13.tagok.meghivok`, info `r13.tagok.visszavonhatod`; no credit | R-2 `POST /api/tagok/meghivo`. No credit field at invite: the new member gets an equal share automatically |

**Szerkesztő** sees Tagok as R-2 without the Kreditek row; **néző** does not see Tagok. `GET /api/kredit/tagok` is owner-only.

## 13c · Rendszergazda (`/koltseg`, admin view) — exempt from the Tibor gate, no `data-r15-kepernyo` (unchanged in round 2)

| On the drawing | Machinery |
|---|---|
| Hívások · AI-gépidő · Becsült költség · Keret (USD) | today's admin columns, unchanged (`/api/koltseg/osszes`, `/api/koltseg/keret`) |
| Havi kredit (number field per workspace) · Mentés per row | `PUT /api/kredit/munkater/{szervezet}` |
| Elhasznált kredit | sum of the members' used credits — **endpoint not named in §2** (kerdesek 6) |

## 13d · Kezdőlap, Hírek, Posztszöveg

| On the drawing | Machinery |
|---|---|
| 13d1 quiet line `r13.kezdolap.kredit_sor` (phone `_rovid`) on the R-15 03c state — replaces R-12 „AI-keret: 4,57 € maradt”; no box, badge or button (T6) | `GET /api/kredit/sajat` (own credit) |
| 13d2 calm teendő row: `r13.kezdolap.elfogyott_sor` + secondary `r13.kezdolap.mire_ment` → `/sajat-fiok` (round 2: no red frame — the judge read it as "I made a mistake") | maradt = 0 (GET) or any AI action answering `KREDIT_ELFOGYOTT` |
| 13d2 card + 13d3 card + 13d2/13d3 phone strip: `r13.kozos.nem_kell_kredit` (round 4, Q14); 13d4 under the sentence: money line `r13.kredit.penz_rovid` | text only |
| 13d3 „Keress most új híreket” disabled + `r13.kredit.elfogyott` under it, muted text with a small dot | maradt = 0 → disabled before the click; `KREDIT_ELFOGYOTT` if it races |
| 13d4 rewrite buttons, Továbbiak, Más nyelven, Saját ötletből disabled + `r13.kredit.elfogyott` under the rewrite buttons | same; all AI actions |
| Primaries „Megnézem a posztot” / „Kész, másolom” | R-15 machinery, no credit |

## Reused existing keys (no change)
`r15.nav.*`, `r15.kozos.{visszajelzes, ertesitesek, menu, halad, halad_rovid, nyugtato, kep_hozza, legutobb, szep_munka, reszletek}`,
`r15.kezdolap.{kerdes, honnan, atnezem_posztot, celok, megirom, meg_apro, kesz_kerdes, kesz_alcim, kesz_ajanlat}`, `r15.kep.uj_kep`,
`r15.hirek.{kerdes, posztod, keress_most, beallitasok, legutobb_rovid}`, `r15.mit.{atirom, kesz, mai_hirek}`, `r15.poszt.*`, `r15.kozos.reszletek`,
R-2 `tagok.{meghivas_gomb, szerep_gomb, eltavolitas_gomb}`, `nav.szerep_tulajdonos`, `nav.szerep_szerkeszto`.
`r15.hirek.kerdes` („Nézd át {az} {n} kész posztot”) needs its n = 1 form in code.
