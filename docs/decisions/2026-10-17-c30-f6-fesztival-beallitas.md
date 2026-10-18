# 2026-10-17 — c30 F6: the festival's setup — type line and question, „Mikor és hol lesz?", „Ez a programod?", the item sheet, Programod

**Decided by:** Csilla approved plan c30 (`docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §2 Part B, §10 F6) and the canvas drawings D1 · D2 · D3 ·
D4 · D9a (canvas „Aitmetica arculatfrissítés", version 1792224034-9eea; notes q30a–e: D3 phone keeps the first day open, an unanswered type
question means Cég, no primary button on D3 empty and D9a). Handed over by the main session after F5 was pushed (`bb905ce`).
**Requirements:** R-15 (Tibor rules), R-01 (the machine never invents: dates/town only from the text or the model, the person confirms),
A-11 (tenant separation), rule 5 (nothing a person wrote is lost), rule 4 (no dead controls). **Migration:** `0175_c30_f6_fesztival_feliratok.sql`
(246 label rows HU/RO/EN, new keys only, `ON CONFLICT` repeatable). No table, column or grant changes.

## What changed

- **Steps come from one function:** `lepesekFor(tipus, vanLista, nyelvekSzama)` in `apps/web/profil/tipus-szabaly.ts`.
  Company: `kinalat · lista · [arak] · [nyelvmod] · oldal · temak` — a one-language company gets exactly today's steps (unit test + mutation).
  Festival: `rendezveny · program · [nyelvmod] · oldal · temak`. The step counter logic is unchanged.
- **D1 (Rólatok card):** a quiet type line („Fesztivál / rendezvény", „Cég · Építőipar", „Cég" when the category is neutral). „Átírom" opens
  Cég/Fesztivál rows + the trade chips. When the model is NOT sure (`biztos: false`) and the person has not answered, the card asks
  „Cég vagytok, vagy fesztivált szerveztek?" with two tiles. Unanswered at approval → Cég (q30b). A person's answer is stored as
  `tipus_sajat` and copied at approval with `tipus_forras = "sajat"`; the model's sure guess as `"ai"`.
- **The festival regex is tighter** (`FESZTIVAL`, `NAGY_NAPOK`): a restaurant's „rendezvények", „programok", „nyitvatartási napok" no longer
  fire; „fesztivál/festival", „Zilele", „Városnap", „…i Napok", „Napok 2026" do. It is only the fallback: the model's `biztos` decides
  whether the question shows.
- **D2 „Mikor és hol lesz?":** javaslatok prompt v3 returns `rendezveny {mettol, meddig, hely}` for a festival; `rendezvenyJavaslat` keeps
  the model's dates only when they are valid and in order, otherwise reads the date range from the description (HU/RO/EN). Stored as
  `rendezveny_javaslat` at approval; the person's confirmed values go to `profil.rendezveny` via `PUT /api/profil/rendezveny`
  (szerkesztő; first day ≤ last day, else 400 `{mezok: {meddig: "korabbi"}}`). „+ Belépő, ha van" opens a link field.
- **D3 „Ez a programod?":** empty state = Link · PDF · Word · Fotó tiles + „Nincs még, később" (no primary button, accepted T2 exception).
  With items: days collapsed with counts, the first day open (phone), „· n átnézendő" per day, the quiet „Ezt nem tudtuk biztosan kiolvasni"
  line on uncertain rows; desktop: 300 px day list + the selected day's items (drawing D3 desktop). Source line from `program_forras`
  (written by `programotOlvas` after a successful read).
- **D4 item sheet** (bottom sheet; desktop centred 560 px — not drawn): name in both languages, day, start–end, venue (+ the second-language
  venue as a hint) above the fold; Részletek: kind chips, performer, a few words, „Fotó hozzá" (upload → `kep_fajl_id`, checked to be the same
  org's file), „Erről ne posztoljunk" (= `aktiv: false`). While the sheet is open the page underneath is `aria-hidden` + `inert`, the
  background „Rendben" is not a primary button and the Feedback button is hidden (drawing D4a).
- **D9a Szervezet adatai → Programod** (`/fiok/program`): summary line, „Újraolvasom" (re-reads the stored link; for a file it reopens the
  same kind of file picker — files are not kept), „Másik fájl", days all collapsed (drawing), „+ Új program", the „we never overwrite" line.
  For a festival the Fiók page shows a Programod section where the company's Kínálat section is.
- **Contracts:** `Rendezveny`; `SzervezetProfil.rendezveny | rendezveny_javaslat | program_forras`; `BemutatkozasLepes.tipus_sajat |
  rendezveny`; `JavaslatokValasz.rendezveny`; `ProgramTetel.kep_fajl_id` (+ in `ProgramTetelMezok`).
- **Behaviour change in F5's reader:** a read that yields no clean item now throws `NINCS_SZOVEG` and writes nothing (before: an empty
  re-read could soft-delete every machine row).
- **Test AI** (`AI_SZOLGALTATO=teszt`) answers the javaslatok type keys deterministically (Zilele → fesztival/sure + a `[MINTA]` town;
  „rendezvén…" → ceg/unsure; térkő → ceg/epites/sure). Two F1 expectations moved with the reason written in place.

## Measured (Cowork VM, local Postgres + `next start`, test AI)

- End to end: new org from the Zilele description → „Fesztivál / rendezvény" → dates 2026-06-25…28 → programme from the synthetic .docx
  (Word tile) and, locally only, the real .docx (upload 200; the AI step is the test stub, so the 88-row views use the F5 fixture seeded
  by SQL) → edit „Re-born tánccsoport" → saved → nyelvmod pre-selected „Egy posztban mindkét nyelv" → oldal → témák → /fiok/program.
- Tibor's paving company: every Part B step **0 differing pixels** at 390 and 1512 before/after (6 screens × 2); only the D1 review card
  changes (the drawn type line).
- Tibor measure (390 × 844): D2, D3a, D4a green; D3c and D9a T2 0 (accepted). Red ones: see the answered questions below.

## Drawing questions — answered by the main session 10-17 (within Csilla's rules)

1. **D9a T5 54** (the drawing word for word): D9a is a settings page → Tibor-exempt (Csilla 10-10). Accepted.
2. **D3b T5 43** with the real Zilele data (two uncertain rows + the source line): accepted for now — the approved drawing is green, real data varies.
3. **D1 review page T5** (red before F6; Tibor's company 54 → 57, the +3 is the drawn type line): the gate does not measure it. `kapu.sh`
   has no Tibor step, and `tools/tibor-proba` (`zar.py`'s input) never opens the onboarding review page (its LAPOK start after
   onboarding; `/fiok` for a company is unchanged). Gate emulation on the rebased commit: `nem-rosszabb`. Nothing trimmed.
4. Accepted as built: the code's own step counter; „Cég" alone for semleges; the undrawn states (Belépő opened, desktop D4 sheet, D9a
   desktop, photo added) in the same idiom; „Újraolvasom" reopens the file picker; internal-note rows listed with the uncertain line;
   the F5 reader change (an empty read writes nothing).
5. **The second-language town (decided):** when the first-language town changes, the second-language town is cleared and re-translated
   ONLY while it is still the machine's (empty, or equal to what the machine last wrote — `rendezveny.hely_gep`, at first the proposal).
   A town the person wrote is never overwritten — the same rule as posts. Pure planner `helyTerv` (profil/tipus-szabaly.ts, unit test +
   mutation); the route translates with `vizual/melle kepFordit` (a failed translation leaves the machine's old town cleared, never
   wrong); `hely_gep` is stored, never taken from the client and never returned.
6. **D9a phone side margin** → 20 px (`--ter-9`) as drawn (`.km-lap-keret.c30-programod`, phone only).
