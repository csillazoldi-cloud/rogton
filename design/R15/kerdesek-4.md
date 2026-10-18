# Questions — R-15 c5 Round 1 (01 Belépés · 02 Első beállítás · 05 Hír részletei · 11 Iránytű)

Only what the drawing could not decide. Each has a marked default (★); if it is fine, no answer is needed.
Drawing: `rajz/R15-lapok-4.dc.html` · machinery: `gepezet-4.md` · labels: `feliratok-5.json` · review page: `rajz/R15-lapok-4-attekintes.html`.

## Questions

1. **(Vilmos) "Elfelejtetted a jelszavad?" has no contact today.** Measured in the migrations: `kozos.kapcsolat` is never set, so the live link is
   hidden (DÖNTÉS 3.4 A) and `/jelszo-elfelejtve` says "Írj neki:" with nobody after it. The drawing puts the link inside the wrong-password line
   (01b), where Tibor looks for it. ★ Vilmos names the support address; it goes in as the `kozos.kapcsolat` label (no code change).
   Until then 01b shows the sentence without the link (as live today) — and the build-time probe will flag 01b T7 (a `baj` line needs an action), which is why the default is to set it.
2. **DECIDED — Csilla 10-10:** the 02 title is „Mit kell tudnunk rólatok?” (`onboarding.eb_cim` gets this new value; RO „Ce trebuie să știm despre voi?”, EN „What do we need to know about you?”).
3. **(Csilla + Vilmos, rule 5) Source badges are taken off the screen** on 02b ("AI-javaslat", "Te adtad meg", "Weboldal alapján",
   "· általad módosítva", "az AI ebből írta") and on 11 (`jelzes.javaslat` / `jelzes.te_adtad`). T3 bans the "AI-javaslat" badge. The data
   (`*_forras`, `*_modositva`) is kept and still saved. ★ Accept.
4. **(Csilla) Goals on 02b stay un-ticked and behind Részletek.** T4 wants everything pre-filled, but J-1 (09-25) deliberately drops the AI goal
   sentence because it was saved without being visible. ★ Keep J-1: goals optional, behind Részletek. (Alternative: pre-tick the AI's goals
   visibly on the card — reverses J-1.)
5. **(Csilla) 05 becomes its own page `/hirfigyelo/hir/[id]`** instead of a popup over the old overview (`/hirfigyelo/osszes?talalat=…`, which
   keeps working). On a phone a popup over a long list is where Tibor gets lost. New route, existing data and endpoints (gepezet-4 · 3).
   ★ New page; the R-15 Hírek card title and "··· › Részletek" link to it.
6. **(Csilla) 05: one click to the post.** The primary calls the same action as 04 ("Készíts belőle posztot" → the 08 page writes it).
   "Kérek tartalomötletet" moves behind Részletek (still works). ★ Accept.
7. **(Vilmos — product direction) 11c turns the compass into post ideas.** Today the page says "A tartalom nem ebből születik, hanem ehhez van
   mérve." T9 asks for one click from a compass idea to a post. The drawing shows the running campaign and the "Amit tolni kell" items as
   up to three idea cards, each with "Készíts belőle posztot" → existing `POST /api/poszt` (`forras.tipus = "terv"`), new client logic only.
   The help text gets a new value (`iranytu.mire_hasznalja_szoveg`). ★ Yes. If no: 11c is the read view with "Módosítás" as primary, and
   the compass stays a measuring stick only.
8. **(Csilla) 11c idea order.** ★ Running campaign → "Amit tolni kell" in its order → goals; at most 3; nothing else.
9. **DECIDED — Csilla 10-10:** keep the wording change („Írjuk…” instead of „Az AI dolgozik…”; the two „…AI-keret…” sentences → `r13.kredit.elfogyott`),
   and — her words — "while something is generated it is important that the user sees the AI is working, otherwise they will keep tapping
   the buttons". Every generating action is now a drawn screen: 02a2 (Készítsük el → „Készítjük…”), 05w and 11c2 („Írjuk a posztot…”),
   11a2 („Írjuk az iránytűtöket…”). The pressed button shows a spinner + text and is disabled; the rest of the screen stays calm (11c2: the other
   idea buttons are greyed). A duration line only where a figure exists: 02 keeps the existing „Kb. fél perc…” (not measured by me); 05/11 have none
   (05/11c answer immediately, the writing happens on 08 with its live spinner; the compass suggestion time is not measured).
   The onboarding loading line „Az AI most olvas, rendez, fogalmaz” stays as is.
10. **(Csilla) 02a: the description field sits behind "Nincs weboldalunk — leírom pár mondatban".** With both visible the phone screen is 50+
    words (T5). It opens by itself when the machine sends Tibor back (A8 "kevés"). ★ Accept.
11. **(Csilla) 11b for a non-owner editor:** "Jóváhagyni a munkatér tulajdonosa tud." as a quiet line, and "Átírom" becomes the primary.
    ★ Accept (the owner view is the drawn one).
12. **(Csilla) 01 phone language picker shows HU / RO / EN** (the existing short form from the Nyitólap) instead of "Magyar ▾". ★ Accept.

## Judge 10-10 (Csilla's Mac, claude-sonnet-5-5, on 383601f: 0 green · 13 yellow · 11 red) — DECIDED by Csilla 13:56

- **Accepted, no change:** 01b asztali + telefon (picks „Elfelejtetted a jelszavad?” / „Jelszó mutatása” after a wrong password — sensible);
  02a asztali (picks „Nincs weboldalunk…” — right without a website). Record: `docs/decisions/2026-10-10-c5-rajz-biralat.md`.
- **Fixed:** working screens („félrenyom: semmit”, 11a2 „nem tudja, mi a dolga; elmenne”) → one calm line next to the busy button:
  02a2 „Kb. fél perc — addig nincs teendőd.” · 05w + 11c2 „Pár másodperc — addig nincs teendőd.” · 11a2 „Eltart egy kicsit — addig nincs teendőd.”
  (11a2: no time promised, not measured). 11a2 title „Most írjuk a céljaitokat”, links hidden while working.
- **Fixed (T1):** 11a „Kérd, és megírjuk a céljaitokat” / „A posztjaid ehhez igazodnak.” · 11b „Ha jó így, hagyd jóvá” / „A posztjaid ehhez igazodnak.”
- Rerun on a49ff0a (14:07): 0 · 11 · 13. **DECIDED 14:09:** (A) working states 02a2/05w/11a2/11c2 are states of their parent page — not judged
  any more (probe still runs, must stay green); (B) 11a gets a greyed example of a finished compass („Így néz majd ki — példa”, 3 static lines).
  Gate note: `zar.py --rajz` does not read accepted reds, so 01b ×2 + 02a asztali still close it — proposed fix in the decision file, not made.
- Rerun on f8f60a1 (14:22): 11a asztali sárga 5, 11a telefon piros 4 (no complaint). **Csilla 14:24: 11a telefon ACCEPTED; Q13 ★ approved; all ★ defaults approved (13:49); build.**
13. **APPROVED 10-10 14:24 — (Csilla) The 11a example is paving-specific** (Kovács Térkő voice) and static: every client sees térkő lines until the code round.
    ★ In the code round pick the example by industry with the existing c15 mechanism (8 trades + neutral), no new AI call; until then the térkő text.

## Removed or moved — vs today's live pages

Nothing is deleted from the product. "Off screen" = not rendered on this page any more, data kept.

| Page | Element today | In the drawing |
|---|---|---|
| 01 | Error box inside the card | one `baj` line above the card (same text) |
| 01 | "Nincs még fiókod? Regisztráció" (phone) | under the form instead of the header |
| 02a | 22-word subtitle `onboarding.eb_szoveg` | replaced by `r15.eb.alcim` (9 words) |
| 02a | "Mivel foglalkoztok?" textarea always visible | behind "Nincs weboldalunk…" link (Q10) |
| 02a/02b | `MentesAllapot` on phone | hidden on phone except its error state |
| 02 (phone) | bordered „HU ▾” and „Mentés és vissza” buttons in the top bar | quiet text controls, same actions (Csilla 10-10, T2) |
| 02b | source badges + "az AI ebből írta" | **off screen** (Q3) |
| 02b | Név field | inside "Rólatok › Átírom" |
| 02b | goals chips, languages chips, "Kit figyeljünk", footnote `eb_lab` | Részletek (Q4) |
| 02b | tone chips, tone description, own tone | inside "Átírom" (the sample sentence stays on the card) |
| 02b | topic chips + add, site list + own site + counter + limit text | inside "Átírom" (ticked items stay on the card) |
| 02b | "Később fejezem be" button | quiet link |
| 05 | popup with "✕ Bezárás" | own page with "← Hírek" (Q5) |
| 05 | category badge (fontos/érdekes/háttér/még készül) | the word, in Részletek |
| 05 | Elmentem / Nem érdekel / Visszaállítás / Eredeti cikk buttons | "···" menu (as on 04) |
| 05 | "Miért kaptad ezt a hírt?", "A vevőidnek", sources list | Részletek |
| 05 | "v{n} beállítással", "AI-összefoglaló · forrásokra hivatkozik" badge | **off screen** (T3) |
| 05 | "Kérek tartalomötletet" + idea text | Részletek (Q6) |
| 11 | left block chooser (6 blocks with counts) | inside "Átírom" / "Módosítás" (the current editor) |
| 11 | approved full read view | 11c: behind "Az egész iránytű" |
| 11 | "Mire használja a rendszer" + "Példa" side box | Részletek |
| 11 | "Verziók" list + "Visszaállítom" | Részletek, titled by date + approver (no "verzió" word) |
| 11 | "Tervezet elvetése" | Részletek (11b) |
| 11 | `jelzes.javaslat` / `jelzes.te_adtad` row marks | **off screen** (Q3) |
